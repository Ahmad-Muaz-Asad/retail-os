"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RestockButton from "./RestockButton";
import { updateProduct, deleteProduct } from "./actions";

type Product = {
    id: number;
    name: string;
    price: number;
    stock: number;
    defaultDiscount: number;
    category: string;
    uom: string;
    createdAt: Date;
};

function StockBadge({ stock }: { stock: number }) {
    if (stock === 0)
        return (
            <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
                Out of Stock
            </span>
        );
    if (stock <= 10)
        return (
            <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                {stock} — Low
            </span>
        );
    return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {stock}
        </span>
    );
}

interface EditModalProps {
    product: Product;
    onClose: () => void;
    onSaved: () => void;
}

function EditProductModal({ product, onClose, onSaved }: EditModalProps) {
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);
        const result = await updateProduct(product.id, formData);
        setIsSaving(false);
        if (result.error) {
            setError(result.error);
        } else {
            onSaved();
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-50">Edit Product</h3>
                        <p className="text-xs text-neutral-500 mt-0.5 font-mono">{product.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Product Name</label>
                        <input
                            required
                            type="text"
                            name="name"
                            id="edit-name"
                            defaultValue={product.name}
                            className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="edit-price" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Price (Rs.)</label>
                            <input
                                required
                                type="number"
                                name="price"
                                id="edit-price"
                                min="0"
                                step="0.01"
                                defaultValue={product.price}
                                className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="edit-stock" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Stock</label>
                            <input
                                required
                                type="number"
                                name="stock"
                                id="edit-stock"
                                min="0"
                                defaultValue={product.stock}
                                className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="edit-discount" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Default Discount (%) <span className="text-neutral-400 font-normal">0–100</span>
                        </label>
                        <input
                            type="number"
                            name="defaultDiscount"
                            id="edit-discount"
                            min="0"
                            max="100"
                            defaultValue={product.defaultDiscount}
                            className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition-colors"
                        >
                            {isSaving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function InventoryClient({ products }: { products: Product[] }) {
    const router = useRouter();
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    async function handleDelete(product: Product) {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.\n\nNote: past sales records will be preserved.`)) return;
        setDeletingId(product.id);
        const result = await deleteProduct(product.id);
        setDeletingId(null);
        if (result.error) {
            alert(`Failed to delete: ${result.error}`);
        } else {
            router.refresh();
        }
    }

    return (
        <>
            {editingProduct && (
                <EditProductModal
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSaved={() => router.refresh()}
                />
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                            {["Name", "Category", "UOM", "Price", "Discount", "Stock", "Added", "Actions"].map((h, i) => (
                                <th
                                    key={h}
                                    className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 ${i >= 3 && i <= 5 ? "text-right" : i === 6 ? "hidden md:table-cell text-left" : i === 7 ? "text-right" : "text-left"}`}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-5 py-12 text-center text-sm text-neutral-400 dark:text-neutral-500">
                                    No products yet. Add your first product below.
                                </td>
                            </tr>
                        )}
                        {products.map((p) => (
                            <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                                <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{p.name}</td>
                                <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{p.category}</td>
                                <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-500 whitespace-nowrap">{p.uom}</td>
                                <td className="px-5 py-3.5 text-right font-mono text-neutral-900 dark:text-neutral-100 whitespace-nowrap">Rs. {p.price.toFixed(0)}</td>
                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                    {p.defaultDiscount > 0 ? (
                                        <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                            {p.defaultDiscount}% off
                                        </span>
                                    ) : (
                                        <span className="text-neutral-300 dark:text-neutral-600 text-xs">—</span>
                                    )}
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-3">
                                        <StockBadge stock={p.stock} />
                                        <RestockButton productId={p.id} />
                                    </div>
                                </td>
                                <td className="hidden md:table-cell px-5 py-3.5 text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                                    {new Date(p.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                </td>
                                <td className="px-5 py-3.5 whitespace-nowrap">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setEditingProduct(p)}
                                            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p)}
                                            disabled={deletingId === p.id}
                                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            {deletingId === p.id ? "…" : "Delete"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
