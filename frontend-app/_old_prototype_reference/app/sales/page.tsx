import { getCompletedSales } from "./actions";
import SalesClient from "./SalesClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sales History | Retail OS",
};

export default async function SalesPage() {
    const sales = await getCompletedSales();
    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 py-10 sm:px-8">
            <div className="mx-auto max-w-6xl space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Sales History
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {sales.length} receipt{sales.length !== 1 ? "s" : ""} recorded
                        </p>
                    </div>
                </div>

                <SalesClient sales={sales} />
            </div>
        </main>
    );
}
