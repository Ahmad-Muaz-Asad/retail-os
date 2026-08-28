import { getCustomers } from "./actions";
import CustomersClient from "./CustomersClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Customers | Retail OS",
};

export default async function CustomersPage() {
    const customers = await getCustomers();
    return (
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-4 py-10 sm:px-8">
            <div className="mx-auto max-w-6xl space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Customers Directory
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {customers.length} customer{customers.length !== 1 ? "s" : ""} registered
                        </p>
                    </div>
                </div>

                <CustomersClient customers={customers} />
            </div>
        </main>
    );
}
