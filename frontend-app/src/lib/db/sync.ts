/**
 * Backend Sync Utility — Retail OS Offline-First Layer
 *
 * This module handles bidirectional sync between the local RxDB database
 * and the Node.js backend at http://localhost:4000.
 *
 * Sync Strategy:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  PULL  (Backend → Local)                                         │
 * │  - On app start / network reconnect, fetch fresh catalog data    │
 * │  - Use `updatedAt` timestamps for delta-only fetches             │
 * │                                                                  │
 * │  PUSH  (Local → Backend)                                         │
 * │  - Sales with status=PENDING_SYNC are queued here                │
 * │  - After successful POST, mark sale as COMPLETED + set syncedAt  │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * Phase 1: Placeholders wired to real fetch() calls.
 * Phase 2: Replace with RxDB replication protocol for live sync.
 */

import type { RxDatabase } from "rxdb";
import type { RetailDBCollections } from "./rxdb-setup";

const BACKEND = "http://localhost:4000";

// ── Pull: Products ─────────────────────────────────────────────────────────

/**
 * Fetches the full product catalog from the backend and upserts into local RxDB.
 * Uses `updatedAt` from the most recent local document to request only deltas.
 */
export async function pullProducts(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        // Find the newest local document to use as a checkpoint
        const newest = await db.products
            .findOne({ sort: [{ updatedAt: "desc" }] })
            .exec();

        const since = newest?.updatedAt ?? "1970-01-01T00:00:00.000Z";
        const res = await fetch(`${BACKEND}/api/pos/products?since=${encodeURIComponent(since)}`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const products = await res.json() as Array<Record<string, unknown>>;
        if (!Array.isArray(products) || products.length === 0) return;

        // Bulk upsert — RxDB ignores docs that haven't changed
        await db.products.bulkUpsert(
            products.map((p) => ({
                id: String(p.id),
                name: String(p.name),
                price: Number(p.price),
                stock: Number(p.stock),
                category: String(p.category),
                defaultDiscount: Number(p.defaultDiscount ?? 0),
                uom: String(p.uom ?? "pcs"),
                updatedAt: String(p.updatedAt ?? new Date().toISOString()),
                syncStatus: "SYNCED" as "SYNCED"
            }))
        );

        console.log(`[Sync] Pulled ${products.length} product(s) from backend.`);
    } catch (err) {
        console.warn("[Sync] pullProducts failed:", err);
    }
}

// ── Pull: Customers ────────────────────────────────────────────────────────

/**
 * Fetches the customer directory from the backend and upserts into local RxDB.
 * Local customer data is used for instant autocomplete without a round-trip.
 */
export async function pullCustomers(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const res = await fetch(`${BACKEND}/api/crm/customers`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const customers = await res.json() as Array<Record<string, unknown>>;
        if (!Array.isArray(customers) || customers.length === 0) return;

        await db.customers.bulkUpsert(
            customers.map((c) => ({
                id: String(c.id),
                name: String(c.name),
                phone: String(c.phone),
                loyaltyPoints: Number(c.loyaltyPoints ?? 0),
                updatedAt: String(c.updatedAt ?? new Date().toISOString()),
            }))
        );

        console.log(`[Sync] Pulled ${customers.length} customer(s) from backend.`);
    } catch (err) {
        console.warn("[Sync] pullCustomers failed:", err);
    }
}

// ── Push: Pending Sales ────────────────────────────────────────────────────

/**
 * Finds all sales with status=PENDING_SYNC and pushes them to the backend.
 * On success, updates each doc: status → COMPLETED, syncedAt → now.
 * Safe to call repeatedly — already-synced docs are skipped.
 */
export async function pushPendingSales(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const pending = await db.sales
            .find({ selector: { syncStatus: { $eq: "PENDING" } } })
            .exec();

        if (pending.length === 0) return;

        for (const sale of pending) {
            try {
                const res = await fetch(`${BACKEND}/api/pos/checkout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tenantId: "tenant_1",
                        saleId: sale.id,
                        totalAmount: sale.totalAmount,
                        subtotal: sale.subtotal,
                        tax: sale.tax,
                        discount: sale.discount,
                        paymentMethod: sale.paymentMethod,
                        items: sale.items,
                        customerId: sale.customerId,
                        employeeId: sale.employeeId,
                        createdAt: sale.createdAt,
                        status: sale.status
                    }),
                });

                if (res.ok) {
                    await sale.patch({
                        syncStatus: "SYNCED",
                        syncedAt: new Date().toISOString(),
                    });
                    console.log(`[Sync] Pushed sale ${sale.id} successfully.`);
                }
            } catch (err) {
                console.warn(`[Sync] Failed to push sale ${sale.id}:`, err);
            }
        }
    } catch (err) {
        console.warn("[Sync] pushPendingSales failed:", err);
    }
}

// ── Pull: Employees ────────────────────────────────────────────────────────

export async function pullEmployees(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const res = await fetch(`${BACKEND}/api/hr/employees`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const employees = await res.json() as Array<Record<string, unknown>>;
        if (!Array.isArray(employees) || employees.length === 0) return;

        await db.employees.bulkUpsert(
            employees.map((e) => ({
                id: String(e.id),
                name: String(e.name),
                role: String(e.role) as "CASHIER" | "MANAGER" | "ADMIN",
                createdAt: String(e.createdAt ?? new Date().toISOString()),
            }))
        );
        console.log(`[Sync] Pulled ${employees.length} employee(s) from backend.`);
    } catch (err) {
        console.warn("[Sync] pullEmployees failed:", err);
    }
}

// ── Pull: Sales ────────────────────────────────────────────────────────────

export async function pullSales(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const res = await fetch(`${BACKEND}/api/pos/sales`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const sales = await res.json() as Array<Record<string, unknown>>;
        if (!Array.isArray(sales) || sales.length === 0) return;

        await db.sales.bulkUpsert(
            sales.map((s) => ({
                id: String(s.id),
                totalAmount: Number(s.totalAmount),
                subtotal: Number(s.subtotal ?? 0),
                tax: Number(s.tax ?? 0),
                discount: Number(s.discount ?? 0),
                paymentMethod: String(s.paymentMethod) as "CASH" | "CARD" | "SPLIT",
                status: String(s.status) as "COMPLETED" | "HOLD" | "PENDING_SYNC",
                items: Array.isArray(s.items) ? s.items.map((i: any) => ({
                    productId: String(i.productId),
                    name: String(i.name),
                    price: Number(i.price),
                    quantity: Number(i.quantity),
                    discount: Number(i.discount ?? 0)
                })) : [],
                customerId: s.customerId ? String(s.customerId) : null,
                employeeId: s.employeeId ? String(s.employeeId) : null,
                createdAt: String(s.createdAt),
                syncedAt: String(s.syncedAt ?? new Date().toISOString()),
                syncStatus: "SYNCED" as "SYNCED"
            }))
        );
        console.log(`[Sync] Pulled ${sales.length} sale(s) from backend.`);
    } catch (err) {
        console.warn("[Sync] pullSales failed:", err);
    }
}

// ── Push: Pending Products ────────────────────────────────────────────────────

export async function pushPendingProducts(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const pending = await db.products
            .find({ selector: { syncStatus: { $eq: "PENDING" } } })
            .exec();

        if (pending.length === 0) return;

        for (const product of pending) {
            try {
                const res = await fetch(`${BACKEND}/api/inventory/products`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        tenantId: "tenant_1",
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        stock: product.stock,
                        category: product.category,
                        uom: product.uom,
                        defaultDiscount: product.defaultDiscount,
                    }),
                });

                if (res.ok) {
                    await product.patch({ syncStatus: "SYNCED" });
                    console.log(`[Sync] Pushed product ${product.id} successfully.`);
                }
            } catch (err) {
                console.warn(`[Sync] Failed to push product ${product.id}:`, err);
            }
        }
    } catch (err) {
        console.warn("[Sync] pushPendingProducts failed:", err);
    }
}

export async function pushPendingCustomers(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const pending = await db.customers.find({ selector: { syncStatus: { $eq: "PENDING" } } }).exec();
        if (pending.length === 0) return;
        for (const c of pending) {
            try {
                const res = await fetch(`${BACKEND}/api/crm/customers`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tenantId: "tenant_1", ...c.toJSON() }),
                });
                if (res.ok) await c.patch({ syncStatus: "SYNCED" });
            } catch (err) { }
        }
    } catch (err) { }
}

export async function pushPendingEmployees(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const pending = await db.employees.find({ selector: { syncStatus: { $eq: "PENDING" } } }).exec();
        if (pending.length === 0) return;
        for (const e of pending) {
            try {
                const res = await fetch(`${BACKEND}/api/hr/employees`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tenantId: "tenant_1", ...e.toJSON() }),
                });
                if (res.ok) await e.patch({ syncStatus: "SYNCED" });
            } catch (err) { }
        }
    } catch (err) { }
}

// ── Pull/Push: Expenses & Attendance ─────────────────────────────────────

export async function pullExpenses(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const res = await fetch(`${BACKEND}/api/finance/expenses`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const expenses = await res.json() as Array<Record<string, unknown>>;
        if (!Array.isArray(expenses) || expenses.length === 0) return;

        await db.expenses.bulkUpsert(
            expenses.map((e) => ({
                id: String(e.id),
                amount: Number(e.amount),
                reason: String(e.reason),
                createdAt: String(e.createdAt ?? new Date().toISOString()),
                syncStatus: "SYNCED" as "SYNCED"
            }))
        );
    } catch (err) {
        console.warn("[Sync] pullExpenses failed:", err);
    }
}

export async function pushPendingExpenses(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const pending = await db.expenses.find({ selector: { syncStatus: { $eq: "PENDING" } } }).exec();
        if (pending.length === 0) return;
        for (const exp of pending) {
            try {
                const res = await fetch(`${BACKEND}/api/finance/expenses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tenantId: "tenant_1", ...exp.toJSON() }),
                });
                if (res.ok) await exp.patch({ syncStatus: "SYNCED" });
            } catch (err) { }
        }
    } catch (err) { }
}

export async function pullAttendance(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const res = await fetch(`${BACKEND}/api/hr/attendance`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const records = await res.json() as Array<Record<string, unknown>>;
        if (!Array.isArray(records) || records.length === 0) return;

        await db.attendance.bulkUpsert(
            records.map((a) => ({
                id: String(a.id),
                employeeId: String(a.employeeId),
                type: String(a.type) as "CLOCK_IN" | "CLOCK_OUT",
                timestamp: String(a.timestamp ?? new Date().toISOString()),
                syncStatus: "SYNCED" as "SYNCED"
            }))
        );
    } catch (err) {
        console.warn("[Sync] pullAttendance failed:", err);
    }
}

export async function pushPendingAttendance(db: RxDatabase<RetailDBCollections>): Promise<void> {
    try {
        const pending = await db.attendance.find({ selector: { syncStatus: { $eq: "PENDING" } } }).exec();
        if (pending.length === 0) return;
        for (const att of pending) {
            try {
                const res = await fetch(`${BACKEND}/api/hr/attendance`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ tenantId: "tenant_1", ...att.toJSON() }),
                });
                if (res.ok) await att.patch({ syncStatus: "SYNCED" });
            } catch (err) { }
        }
    } catch (err) { }
}

// ── Full Sync (convenience) ────────────────────────────────────────────────

/**
 * Runs a full sync cycle: pull catalog + customers + employees + sales, then push any queued sales and products.
 * Call this on app mount and on reconnect events.
 */
export async function runFullSync(db: RxDatabase<RetailDBCollections>): Promise<void> {
    await Promise.allSettled([
        pullProducts(db),
        pullCustomers(db),
        pullEmployees(db),
        pullSales(db),
        pullExpenses(db),
        pullAttendance(db),
    ]);
    await Promise.allSettled([
        pushPendingSales(db),
        pushPendingProducts(db),
        pushPendingExpenses(db),
        pushPendingAttendance(db),
        pushPendingCustomers(db),
        pushPendingEmployees(db),
    ]);
}
