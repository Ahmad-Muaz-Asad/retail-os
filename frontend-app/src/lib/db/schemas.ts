/**
 * RxDB Collection Schemas — Retail OS
 *
 * Defines the JSON schemas for all local collections used in offline-first operation.
 * These schemas are used by RxDB to validate documents and generate TypeScript types.
 *
 * Design notes:
 * - `id` is a string everywhere (DynamoDB SK-friendly).
 * - `version` must increment whenever the schema changes (triggers RxDB migration).
 * - Fields prefixed with `rx` are RxDB internals and must NOT be included.
 */

import type { RxJsonSchema } from "rxdb";

// ── Product ───────────────────────────────────────────────────────────────────

export type ProductDocument = {
    id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    defaultDiscount: number; // 0-100 integer, applied at POS cart
    uom: string;             // Unit of Measure: e.g. "kg", "pcs", "ltrs"
    updatedAt: string;       // ISO timestamp for sync conflict resolution
    syncStatus: "PENDING" | "SYNCED";
};

export const productSchema: RxJsonSchema<ProductDocument> = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: { type: "string", maxLength: 100 },
        name: { type: "string" },
        price: { type: "number", minimum: 0 },
        stock: { type: "number", minimum: 0 },
        category: { type: "string" },
        defaultDiscount: { type: "number", minimum: 0, maximum: 100 },
        uom: { type: "string" },
        updatedAt: { type: "string" },
        syncStatus: { type: "string", enum: ["PENDING", "SYNCED"] },
    },
    required: ["id", "name", "price", "stock", "category", "defaultDiscount", "uom", "updatedAt", "syncStatus"],
    indexes: ["category", "updatedAt", "syncStatus"],
};

// ── Customer ──────────────────────────────────────────────────────────────────

export type CustomerDocument = {
    id: string;
    name: string;
    phone: string;   // Unique, used as CRM lookup key
    loyaltyPoints: number;
    updatedAt: string;
    syncStatus: "PENDING" | "SYNCED";
};

export const customerSchema: RxJsonSchema<CustomerDocument> = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: { type: "string", maxLength: 100 },
        name: { type: "string" },
        phone: { type: "string", maxLength: 20 },
        loyaltyPoints: { type: "number", minimum: 0 },
        updatedAt: { type: "string" },
        syncStatus: { type: "string", enum: ["PENDING", "SYNCED"] },
    },
    required: ["id", "name", "phone", "loyaltyPoints", "updatedAt", "syncStatus"],
    indexes: ["phone", "name", "updatedAt", "syncStatus"],
};

// ── Sale ──────────────────────────────────────────────────────────────────────

export type SaleItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    discount: number;
};

export type SaleDocument = {
    id: string;
    totalAmount: number;
    subtotal: number;
    tax: number;
    discount: number;
    paymentMethod: "CASH" | "CARD" | "SPLIT";
    status: "COMPLETED" | "HOLD" | "PENDING_SYNC";
    items: SaleItem[];   // Embedded array — RxDB stores this as a nested object
    customerId: string | null;
    employeeId: string | null;
    createdAt: string;
    syncedAt: string | null; // null until successfully synced to backend
    syncStatus: "PENDING" | "SYNCED";
};

export const saleSchema: RxJsonSchema<SaleDocument> = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: { type: "string", maxLength: 100 },
        totalAmount: { type: "number", minimum: 0 },
        subtotal: { type: "number", minimum: 0 },
        tax: { type: "number", minimum: 0 },
        discount: { type: "number", minimum: 0 },
        paymentMethod: { type: "string", enum: ["CASH", "CARD", "SPLIT"] },
        status: { type: "string", enum: ["COMPLETED", "HOLD", "PENDING_SYNC"] },
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    productId: { type: "string" },
                    name: { type: "string" },
                    price: { type: "number" },
                    quantity: { type: "number" },
                    discount: { type: "number" },
                },
                required: ["productId", "name", "price", "quantity", "discount"],
            },
        },
        customerId: { type: ["string", "null"] },
        employeeId: { type: ["string", "null"] },
        createdAt: { type: "string" },
        syncedAt: { type: ["string", "null"] },
        syncStatus: { type: "string", enum: ["PENDING", "SYNCED"] },
    },
    required: [
        "id", "totalAmount", "subtotal", "tax", "discount",
        "paymentMethod", "status", "items", "customerId", "employeeId",
        "createdAt", "syncedAt", "syncStatus",
    ],
    indexes: ["status", "createdAt", "syncedAt", "syncStatus"],
};

// ── Employee ──────────────────────────────────────────────────────────────────

export type EmployeeDocument = {
    id: string;
    name: string;
    role: "CASHIER" | "MANAGER" | "ADMIN";
    createdAt: string;
    syncStatus: "PENDING" | "SYNCED";
};

export const employeeSchema: RxJsonSchema<EmployeeDocument> = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: { type: "string", maxLength: 100 },
        name: { type: "string" },
        role: { type: "string", enum: ["CASHIER", "MANAGER", "ADMIN"] },
        createdAt: { type: "string" },
        syncStatus: { type: "string", enum: ["PENDING", "SYNCED"] },
    },
    required: ["id", "name", "role", "createdAt", "syncStatus"],
    indexes: ["createdAt", "syncStatus"],
};

// ── Expense ───────────────────────────────────────────────────────────────────

export type ExpenseDocument = {
    id: string;
    amount: number;
    reason: string;
    createdAt: string;
    syncStatus: "PENDING" | "SYNCED";
};

export const expenseSchema: RxJsonSchema<ExpenseDocument> = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: { type: "string", maxLength: 100 },
        amount: { type: "number", minimum: 0 },
        reason: { type: "string" },
        createdAt: { type: "string" },
        syncStatus: { type: "string", enum: ["PENDING", "SYNCED"] },
    },
    required: ["id", "amount", "reason", "createdAt", "syncStatus"],
    indexes: ["createdAt", "syncStatus"],
};

// ── Attendance ────────────────────────────────────────────────────────────────

export type AttendanceDocument = {
    id: string;
    employeeId: string;
    type: "CLOCK_IN" | "CLOCK_OUT";
    timestamp: string;
    syncStatus: "PENDING" | "SYNCED";
};

export const attendanceSchema: RxJsonSchema<AttendanceDocument> = {
    version: 0,
    primaryKey: "id",
    type: "object",
    properties: {
        id: { type: "string", maxLength: 100 },
        employeeId: { type: "string", maxLength: 100 },
        type: { type: "string", enum: ["CLOCK_IN", "CLOCK_OUT"] },
        timestamp: { type: "string" },
        syncStatus: { type: "string", enum: ["PENDING", "SYNCED"] },
    },
    required: ["id", "employeeId", "type", "timestamp", "syncStatus"],
    indexes: ["employeeId", "timestamp", "syncStatus"],
};
