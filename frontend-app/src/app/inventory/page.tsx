"use client";

import { useState, useRef } from "react";
import { useProducts } from "@/lib/db/hooks";
import type { ProductDocument } from "@/lib/db/schemas";

const UOM_OPTIONS = ["kg", "g", "lb", "oz", "L", "mL", "pcs", "box", "pack", "dozen"];

// ── Components ────────────────────────────────────────────────────────────────

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

function RestockButton({ product }: { product: ProductDocument }) {
    const [isRestocking, setIsRestocking] = useState(false);
    const [qty, setQty] = useState("");
    const [isPending, setIsPending] = useState(false);

    const handleRestock = async () => {
        const q = parseInt(qty, 10);
        if (isNaN(q) || q <= 0) return;
        setIsPending(true);
        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (db) {
                const doc = await db.products.findOne(product.id).exec();
                if (doc) {
                    await doc.patch({
                        stock: doc.stock + q,
                        updatedAt: new Date().toISOString(),
                        syncStatus: "PENDING" as "PENDING"
                    });
                    // Background sync inline
                    const { pushPendingProducts } = await import("@/lib/db/sync");
                    pushPendingProducts(db).catch(console.error);
                }
            }
            setIsRestocking(false);
            setQty("");
        } catch (err) {
            alert("Failed to restock.");
        } finally {
            setIsPending(false);
        }
    };

    if (isRestocking) {
        return (
            <div className="flex items-center gap-1.5 shrink-0">
                <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="w-14 px-1.5 py-0.5 text-xs text-right border border-neutral-300 dark:border-neutral-600 rounded focus:ring-1 focus:ring-indigo-500 font-mono focus:outline-none dark:bg-neutral-700 dark:text-neutral-100"
                    placeholder="+ Qty"
                    autoFocus
                    onKeyDown={(e) => {
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
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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

function EditProductModal({ product, onClose }: { product: ProductDocument; onClose: () => void }) {
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);

        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (db) {
                const doc = await db.products.findOne(product.id).exec();
                if (doc) {
                    await doc.patch({
                        name: formData.get("name") as string,
                        price: parseFloat(formData.get("price") as string),
                        stock: parseInt(formData.get("stock") as string, 10),
                        category: formData.get("category") as string,
                        uom: formData.get("uom") as string,
                        defaultDiscount: parseInt(formData.get("defaultDiscount") as string, 10) || 0,
                        updatedAt: new Date().toISOString(),
                        syncStatus: "PENDING" as "PENDING"
                    });
                    const { pushPendingProducts } = await import("@/lib/db/sync");
                    pushPendingProducts(db).catch(console.error);
                }
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to update product");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-50">Edit Product</h3>
                        <p className="text-xs text-neutral-500 mt-0.5 font-mono">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Product Name</label>
                        <input
                            required
                            type="text"
                            name="name"
                            defaultValue={product.name}
                            className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Price (Rs.)</label>
                            <input
                                required
                                type="number"
                                name="price"
                                min="0"
                                step="0.01"
                                defaultValue={product.price}
                                className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Stock</label>
                            <input
                                required
                                type="number"
                                name="stock"
                                min="0"
                                defaultValue={product.stock}
                                className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
                            <input
                                required
                                type="text"
                                name="category"
                                defaultValue={product.category}
                                className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">UOM</label>
                            <select
                                name="uom"
                                required
                                defaultValue={product.uom}
                                className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select UOM</option>
                                {UOM_OPTIONS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                            Default Discount (%) <span className="text-neutral-400 font-normal">0–100</span>
                        </label>
                        <input
                            type="number"
                            name="defaultDiscount"
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
                            className="flex-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
                        >
                            {isSaving ? "Saving…" : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
    // Subscribes to local IndexedDB changes automatically via RxJS
    const products = useProducts();
    const [editingProduct, setEditingProduct] = useState<ProductDocument | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form state
    const formRef = useRef<HTMLFormElement>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    async function handleDelete(product: ProductDocument) {
        if (!window.confirm(`Delete "${product.name}"? This cannot be undone.\n\nNote: offline sales referencing this product will retain old pricing data.`)) {
            return;
        }

        setDeletingId(product.id);
        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (db) {
                const doc = await db.products.findOne(product.id).exec();
                if (doc) await doc.remove();
            }
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    }

    async function handleAddProduct(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setAddError(null);
        setIsAdding(true);
        const formData = new FormData(e.currentTarget);

        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (db) {
                const productId = Math.random().toString(36).substring(2, 10);
                const localDoc = {
                    id: productId,
                    name: formData.get("name") as string,
                    price: parseFloat(formData.get("price") as string),
                    stock: parseInt(formData.get("stock") as string, 10),
                    category: formData.get("category") as string,
                    uom: formData.get("uom") as string,
                    defaultDiscount: parseInt(formData.get("defaultDiscount") as string, 10) || 0,
                    updatedAt: new Date().toISOString(),
                    syncStatus: "PENDING" as "PENDING"
                };

                await db.products.insert(localDoc);
                formRef.current?.reset();

                // Inline push sync
                const { pushPendingProducts } = await import("@/lib/db/sync");
                pushPendingProducts(db).catch(console.error);
            }
        } catch (err: any) {
            setAddError(err.message || "Failed to add product");
        } finally {
            setIsAdding(false);
        }
    }

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
                        Local RxDB
                    </span>
                </div>

                {editingProduct && (
                    <EditProductModal
                        product={editingProduct}
                        onClose={() => setEditingProduct(null)}
                    />
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm bg-white dark:bg-neutral-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                                    {["Name", "Category", "UOM", "Price", "Discount", "Stock", "Last Synced", "Actions"].map((h, i) => (
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
                                                <RestockButton product={p} />
                                            </div>
                                        </td>
                                        <td className="hidden md:table-cell px-5 py-3.5 text-neutral-400 dark:text-neutral-500 whitespace-nowrap cursor-help" title={p.updatedAt}>
                                            {new Date(p.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                </div>

                {/* Add Product Form */}
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-5">
                        Add New Product
                    </h2>

                    <form ref={formRef} onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Product Name</label>
                            <input
                                name="name"
                                type="text"
                                required
                                placeholder="e.g. Basmati Rice"
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Price (Rs.)</label>
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

                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Stock Quantity</label>
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

                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Category</label>
                            <input
                                name="category"
                                type="text"
                                required
                                placeholder="e.g. Grains"
                                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">Unit of Measure</label>
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

                        <div className="sm:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-medium text-white transition-colors"
                            >
                                {isAdding ? (
                                    <>
                                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Saving…
                                    </>
                                ) : (
                                    "Add Product"
                                )}
                            </button>

                            {addError && (
                                <p className="text-sm text-red-500 dark:text-red-400">{addError}</p>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
