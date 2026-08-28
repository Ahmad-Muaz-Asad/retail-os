"use client";

import { useState, useTransition } from "react";
import { addStock } from "./actions";

export default function RestockButton({ productId }: { productId: number }) {
    const [isPending, startTransition] = useTransition();
    const [isRestocking, setIsRestocking] = useState(false);
    const [qty, setQty] = useState("");

    const handleRestock = () => {
        const q = parseInt(qty, 10);
        if (isNaN(q) || q <= 0) return;
        startTransition(async () => {
            const result = await addStock(productId, q);
            if (result.success) {
                setIsRestocking(false);
                setQty("");
            } else {
                alert(result.error);
            }
        });
    };

    if (isRestocking) {
        return (
            <div className="flex items-center gap-1.5 shrink-0">
                <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    className="w-14 px-1.5 py-0.5 text-xs text-right border border-neutral-300 dark:border-neutral-600 rounded focus:ring-1 focus:ring-indigo-500 font-mono focus:outline-none dark:bg-neutral-700 dark:text-neutral-100"
                    placeholder="+ Qty"
                    autoFocus
                    onKeyDown={e => {
                        if (e.key === "Enter") handleRestock();
                        if (e.key === "Escape") setIsRestocking(false);
                    }}
                />
                <button
                    onClick={handleRestock}
                    disabled={isPending || !qty}
                    className="p-1 px-2 text-xs font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50 transition-colors"
                >
                    {isPending ? "..." : "Save"}
                </button>
                <button
                    onClick={() => setIsRestocking(false)}
                    className="p-1 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                    title="Cancel"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsRestocking(true)}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide hover:underline shrink-0"
        >
            + Restock
        </button>
    );
}
