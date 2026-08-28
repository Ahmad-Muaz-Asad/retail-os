import { getProducts } from "./actions";
import POSClient from "./POSClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Point of Sale | Retail OS",
    description: "Ring up sales, manage your cart, and process checkouts with CASH, CARD, or SPLIT payment.",
};

export default async function POSPage() {
    const products = await getProducts();
    return (
        <main className="flex flex-col h-[calc(100vh-64px)]">
            <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
                <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                    Point of Sale
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Live
                </span>
            </div>
            <POSClient products={products} />
        </main>
    );
}
