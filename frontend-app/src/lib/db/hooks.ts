/**
 * useProducts — RxDB Reactive Hook
 *
 * Subscribes to the local `products` collection via an RxJS observable.
 * The component re-renders automatically whenever any product document changes
 * (insert, update, delete) — this is the core of the offline-first reactive loop.
 *
 * On mount:
 *  1. Initializes the RxDB database (no-op if already initialized)
 *  2. Subscribes to db.products.find().$
 *  3. After the first emit, triggers a background sync pull from the backend
 *
 * This hook is SSR-safe: returns an empty array during server rendering.
 */

"use client";

import { useState, useEffect } from "react";
import type { ProductDocument, CustomerDocument, SaleDocument, ExpenseDocument, AttendanceDocument, EmployeeDocument } from "@/lib/db/schemas";

export function useProducts(): ProductDocument[] {
    const [products, setProducts] = useState<ProductDocument[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let subscription: { unsubscribe: () => void } | null = null;
        let cancelled = false;

        (async () => {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db || cancelled) return;

            // Subscribe to the live RxJS observable from RxDB
            subscription = db.products
                .find({ sort: [{ name: "asc" }] })
                .$ // This is an RxJS Observable<ProductDocument[]>
                .subscribe((docs) => {
                    setProducts(docs.map((d) => d.toJSON()));
                });

            // Fire-and-forget background sync pull
            import("@/lib/db/sync").then(({ pullProducts }) => {
                if (!cancelled) pullProducts(db).catch(console.warn);
            });
        })();

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, []);

    return products;
}

// ... existing code ...

/**
 * useCustomers — RxDB Reactive Hook
 */
export function useCustomers(): CustomerDocument[] {
    const [customers, setCustomers] = useState<CustomerDocument[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let subscription: { unsubscribe: () => void } | null = null;
        let cancelled = false;

        (async () => {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db || cancelled) return;

            subscription = db.customers
                .find({ sort: [{ name: "asc" }] })
                .$
                .subscribe((docs) => {
                    setCustomers(docs.map((d) => d.toJSON()));
                });

            // Fire-and-forget background sync pull (assuming pullCustomers is implemented in sync.ts)
            import("@/lib/db/sync").then(({ pullCustomers }) => {
                if (!cancelled && typeof pullCustomers === 'function') {
                    pullCustomers(db).catch(console.warn);
                }
            });
        })();

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, []);

    return customers;
}

/**
 * useCustomerSales — RxDB Reactive Hook
 * Returns the sales history for a specific customer, sorted by newest first.
 */
export function useCustomerSales(customerId: string | null): SaleDocument[] {
    const [sales, setSales] = useState<SaleDocument[]>([]);

    useEffect(() => {
        if (typeof window === "undefined" || !customerId) {
            setSales([]);
            return;
        }

        let subscription: { unsubscribe: () => void } | null = null;
        let cancelled = false;

        (async () => {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db || cancelled) return;

            subscription = db.sales
                .find({
                    selector: { customerId },
                    sort: [{ createdAt: "desc" }]
                })
                .$
                .subscribe((docs) => {
                    setSales(docs.map((d) => d.toJSON() as unknown as SaleDocument));
                });
        })();

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, [customerId]);

    return sales;
}

/**
 * useAllSales — RxDB Reactive Hook
 * Returns all local sales, sorted by newest first.
 */
export function useAllSales(): SaleDocument[] {
    const [sales, setSales] = useState<SaleDocument[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let subscription: { unsubscribe: () => void } | null = null;
        let cancelled = false;

        (async () => {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db || cancelled) return;

            subscription = db.sales
                .find({ sort: [{ createdAt: "desc" }] })
                .$
                .subscribe((docs) => {
                    setSales(docs.map((d) => d.toJSON() as unknown as SaleDocument));
                });
        })();

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, []);

    return sales;
}

/**
 * useExpenses — RxDB Reactive Hook
 */
export function useExpenses(): ExpenseDocument[] {
    const [expenses, setExpenses] = useState<ExpenseDocument[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let subscription: { unsubscribe: () => void } | null = null;
        let cancelled = false;

        (async () => {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db || cancelled) return;

            subscription = db.expenses
                .find({ sort: [{ createdAt: "desc" }] })
                .$
                .subscribe((docs) => {
                    setExpenses(docs.map((d) => d.toJSON()));
                });
        })();

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, []);

    return expenses;
}

/**
 * useAttendance — RxDB Reactive Hook
 */
export function useAttendance(): AttendanceDocument[] {
    const [attendance, setAttendance] = useState<AttendanceDocument[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let subscription: { unsubscribe: () => void } | null = null;
        let cancelled = false;

        (async () => {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db || cancelled) return;

            subscription = db.attendance
                .find({ sort: [{ timestamp: "desc" }] })
                .$
                .subscribe((docs) => {
                    setAttendance(docs.map((d) => d.toJSON()));
                });
        })();

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, []);

    return attendance;
}

/**
 * useEmployees — RxDB Reactive Hook
 */
export function useEmployees(): EmployeeDocument[] {
    const [employees, setEmployees] = useState<EmployeeDocument[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let subscription: { unsubscribe: () => void } | null = null;
        let cancelled = false;

        (async () => {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db || cancelled) return;

            subscription = db.employees
                .find({ sort: [{ createdAt: "desc" }] })
                .$
                .subscribe((docs) => {
                    setEmployees(docs.map((d) => d.toJSON()));
                });
        })();

        return () => {
            cancelled = true;
            subscription?.unsubscribe();
        };
    }, []);

    return employees;
}
