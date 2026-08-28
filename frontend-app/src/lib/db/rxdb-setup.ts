/**
 * RxDB Local Database Setup — Retail OS
 *
 * Initializes the singleton RxDB database with IndexedDB (Dexie) storage
 * and registers all collections defined in schemas.ts.
 *
 * Usage:
 *   const db = await getDB();
 *   const products$ = db.products.find().$; // RxJS Observable
 */

import { createRxDatabase, addRxPlugin } from "rxdb";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import type { RxCollection, RxDatabase } from "rxdb";
import {
  productSchema,
  customerSchema,
  saleSchema,
  employeeSchema,
  expenseSchema,
  attendanceSchema,
  type ProductDocument,
  type CustomerDocument,
  type SaleDocument,
  type EmployeeDocument,
  type ExpenseDocument,
  type AttendanceDocument,
} from "./schemas";

// ── Dev-mode plugin (strips out in production) ────────────────────────────────

/*
if (process.env.NODE_ENV !== "production") {
  addRxPlugin(RxDBDevModePlugin);
}
*/

// Add update plugin for patch() support on documents
addRxPlugin(RxDBUpdatePlugin);

// ── Collection type map (exported so sync.ts can reference it) ────────────────

export type RetailDBCollections = {
  products: RxCollection<ProductDocument>;
  customers: RxCollection<CustomerDocument>;
  sales: RxCollection<SaleDocument>;
  employees: RxCollection<EmployeeDocument>;
  expenses: RxCollection<ExpenseDocument>;
  attendance: RxCollection<AttendanceDocument>;
};

export type RetailDB = RxDatabase<RetailDBCollections>;

// ── Singleton ─────────────────────────────────────────────────────────────────

let dbInstance: RetailDB | null = null;
let initPromise: Promise<RetailDB | null> | null = null;

/**
 * Returns the singleton RxDB instance, initializing it on the first call.
 * Subsequent calls return the cached instance immediately.
 * Returns `null` when called during SSR (server-side rendering).
 */
export async function getDB(): Promise<RetailDB | null> {
  if (typeof window === "undefined") return null; // SSR guard

  if (dbInstance) return dbInstance;
  if (typeof window !== "undefined" && (window as any).__rxdbInstance) {
    dbInstance = (window as any).__rxdbInstance;
    return dbInstance;
  }

  // Prevent parallel init races
  if (initPromise) return initPromise;
  if (typeof window !== "undefined" && (window as any).__rxdbPromise) {
    initPromise = (window as any).__rxdbPromise;
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const { getRxStorageDexie } = await import("rxdb/plugins/storage-dexie");

      const db = await createRxDatabase<RetailDBCollections>({
        name: "retail_os_local",
        storage: getRxStorageDexie(),
        multiInstance: false,
        eventReduce: true,
      });

      // Register all collections in a single call
      await db.addCollections({
        products: { schema: productSchema },
        customers: { schema: customerSchema },
        sales: { schema: saleSchema },
        employees: { schema: employeeSchema },
        expenses: { schema: expenseSchema },
        attendance: { schema: attendanceSchema },
      });

      dbInstance = db;
      if (typeof window !== "undefined") {
        (window as any).__rxdbInstance = db;
      }
      console.log("[RxDB] Database initialized with collections: products, customers, sales, employees, expenses, attendance");
      return db;
    } catch (err) {
      console.error("[RxDB] Initialization failed:", err);
      initPromise = null; // Allow retry on next call
      if (typeof window !== "undefined") {
        (window as any).__rxdbPromise = null;
      }
      return null;
    }
  })();

  if (typeof window !== "undefined") {
    (window as any).__rxdbPromise = initPromise;
  }

  return initPromise;
}

/**
 * @deprecated Use `getDB()` instead. Kept for backwards compatibility.
 */
export const initializeDB = getDB;
