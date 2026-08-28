import { getProducts } from "./actions";
import AddProductForm from "./AddProductForm";
import InventoryClient from "./InventoryClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Inventory | Retail OS",
    description: "Manage your product inventory — view stock levels and add new products.",
};

export default async function InventoryPage() {
    const products = await getProducts();

    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 py-10 sm:px-8">
            <div className="mx-auto max-w-6xl space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Inventory
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {products.length} product{products.length !== 1 ? "s" : ""} in catalogue
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                        Live · SQLite
                    </span>
                </div>

                {/* Table — includes Edit & Delete per row */}
                <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm bg-white dark:bg-neutral-900">
                    <InventoryClient products={products} />
                </div>

                {/* Add Product Form */}
                <AddProductForm />
            </div>
        </main>
    );
}
