"use client";

import { useActionState, useEffect, useRef } from "react";
import { addProduct } from "./actions";

const initialState = { error: undefined, success: false };

const UOM_OPTIONS = ["kg", "g", "lb", "oz", "L", "mL", "pcs", "box", "pack", "dozen"];

export default function AddProductForm() {
    const [state, formAction, isPending] = useActionState(addProduct, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset();
        }
    }, [state.success]);

    return (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-5">
                Add New Product
            </h2>

            <form ref={formRef} action={formAction} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Product Name
                    </label>
                    <input
                        name="name"
                        type="text"
                        required
                        placeholder="e.g. Basmati Rice"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>

                {/* Price */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Price (Rs.)
                    </label>
                    <input
                        name="price"
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>

                {/* Stock */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Stock Quantity
                    </label>
                    <input
                        name="stock"
                        type="number"
                        required
                        min="0"
                        step="1"
                        placeholder="0"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Category
                    </label>
                    <input
                        name="category"
                        type="text"
                        required
                        placeholder="e.g. Grains"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                </div>

                {/* UOM */}
                <div>
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Unit of Measure
                    </label>
                    <select
                        name="uom"
                        required
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    >
                        <option value="">Select UOM</option>
                        {UOM_OPTIONS.map((u) => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </div>

                {/* Default Discount */}
                <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                        Default Sale Discount <span className="text-indigo-500">(0 – 100 %)</span>
                    </label>
                    <input
                        name="defaultDiscount"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        defaultValue="0"
                        placeholder="0"
                        className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    />
                    <p className="mt-1 text-[10px] text-neutral-400 dark:text-neutral-500">
                        This will pre-fill the discount slider at POS for this product.
                    </p>
                </div>

                {/* Feedback & Submit */}
                <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-medium text-white transition-colors"
                    >
                        {isPending ? (
                            <>
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Saving…
                            </>
                        ) : (
                            "Add Product"
                        )}
                    </button>

                    {state.error && (
                        <p className="text-sm text-red-500 dark:text-red-400">{state.error}</p>
                    )}
                    {state.success && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            ✓ Product added successfully!
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
