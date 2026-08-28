"use client";

import { useState, useRef } from "react";
import { useCustomers, useCustomerSales } from "@/lib/db/hooks";
import type { CustomerDocument } from "@/lib/db/schemas";

function CustomerHistoryModal({
    customer,
    onClose,
}: {
    customer: CustomerDocument;
    onClose: () => void;
}) {
    const sales = useCustomerSales(customer.id);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-50">
                            {customer.name}&apos;s History
                        </h3>
                        <p className="text-sm font-mono text-neutral-500">{customer.phone}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {sales.length === 0 ? (
                        <p className="text-sm text-neutral-500 text-center py-8">
                            No order history available.
                        </p>
                    ) : (
                        sales.map((sale) => (
                            <div
                                key={sale.id}
                                className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 bg-neutral-50 dark:bg-neutral-800/20"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                                            Invoice #{sale.id.slice(-6).toUpperCase()}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {new Date(sale.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                            Rs. {sale.totalAmount}
                                        </p>
                                        <p className="text-[10px] uppercase font-semibold text-neutral-500">
                                            {sale.paymentMethod} • {sale.status}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-neutral-100 dark:border-neutral-800 text-xs">
                                    {sale.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                                        >
                                            <span className="text-neutral-700 dark:text-neutral-300">
                                                {item.quantity}x {item.name || "Unknown"}
                                            </span>
                                            <span className="font-mono text-neutral-600 dark:text-neutral-400">
                                                Rs. {Math.round(item.price * (1 - item.discount / 100)) * item.quantity}
                                            </span>
                                        </div>
                                    ))}
                                    {(sale.tax > 0 || sale.discount > 0) && (
                                        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 font-mono text-neutral-500">
                                            {sale.tax > 0 && (
                                                <div className="flex justify-between">
                                                    <span>Tax</span>
                                                    <span>Rs. {sale.tax}</span>
                                                </div>
                                            )}
                                            {sale.discount > 0 && (
                                                <div className="flex justify-between text-emerald-500">
                                                    <span>Discount</span>
                                                    <span>- Rs. {sale.discount}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CustomersPage() {
    const customers = useCustomers();
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerDocument | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const formRef = useRef<HTMLFormElement>(null);

    async function handleAddSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setAddError(null);
        setIsAdding(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;

        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (db) {
                // Check if phone already exists
                const existing = await db.customers.findOne({ selector: { phone } }).exec();
                if (existing) {
                    throw new Error("A customer with this phone number already exists.");
                }

                await db.customers.insert({
                    id: Math.random().toString(36).substring(2, 10),
                    name,
                    phone,
                    loyaltyPoints: 0,
                    updatedAt: new Date().toISOString(),
                    syncStatus: "PENDING"
                });
                // Trigger background push
                import("@/lib/db/sync").then(m => m.pushPendingCustomers(db));
                formRef.current?.reset();
                setShowAddForm(false);
            }
        } catch (err: any) {
            setAddError(err.message || "Failed to add customer");
        } finally {
            setIsAdding(false);
        }
    }

    async function handleDelete(customer: CustomerDocument, e: React.MouseEvent) {
        e.stopPropagation(); // Prevents opening the modal
        if (
            !window.confirm(
                `Delete customer "${customer.name}" (${customer.phone})?\n\nTheir past purchase history will be preserved offline.`
            )
        ) {
            return;
        }

        setDeletingId(customer.id);
        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (db) {
                const doc = await db.customers.findOne(customer.id).exec();
                if (doc) await doc.remove();
            }
        } catch (err: any) {
            alert(`Failed to delete: ${err.message}`);
        } finally {
            setDeletingId(null);
        }
    }

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

                <div className="space-y-6">
                    {/* Add Customer Panel */}
                    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                Customer List
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAddForm(!showAddForm);
                                    setAddError(null);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                {showAddForm ? "Cancel" : "Add Customer"}
                            </button>
                        </div>

                        {showAddForm && (
                            <form
                                ref={formRef}
                                onSubmit={handleAddSubmit}
                                className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-indigo-50/40 dark:bg-indigo-950/20"
                            >
                                {addError && (
                                    <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                                        {addError}
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                        <label htmlFor="cust-name" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                            Full Name
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            id="cust-name"
                                            placeholder="e.g. Ali Khan"
                                            className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label htmlFor="cust-phone" className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                            Phone Number
                                        </label>
                                        <input
                                            required
                                            type="text"
                                            name="phone"
                                            id="cust-phone"
                                            placeholder="e.g. 03001234567"
                                            className="block w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            disabled={isAdding}
                                            className="w-full sm:w-auto rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold text-white transition-colors"
                                        >
                                            {isAdding ? "Adding…" : "Add"}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Customer Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customers.length === 0 && (
                            <div className="col-span-full py-12 text-center text-sm text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
                                No customers yet. Use &quot;Add Customer&quot; above or add one during POS checkout.
                            </div>
                        )}
                        {customers.map((customer) => (
                            <div
                                key={customer.id}
                                className="relative text-left bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md hover:shadow-indigo-50 dark:hover:shadow-indigo-900/10 transition-all group"
                            >
                                {/* Delete button */}
                                <button
                                    onClick={(e) => handleDelete(customer, e)}
                                    disabled={deletingId === customer.id}
                                    className="absolute z-10 top-3 right-3 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 px-2 py-1 text-[10px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800 disabled:opacity-50"
                                    title="Delete customer"
                                >
                                    {deletingId === customer.id ? (
                                        "…"
                                    ) : (
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    )}
                                </button>

                                {/* Card content */}
                                <button
                                    onClick={() => setSelectedCustomer(customer)}
                                    className="w-full text-left focus:outline-none"
                                >
                                    <div className="flex justify-between items-start mb-2 pr-8">
                                        <h3 className="font-bold text-neutral-900 dark:text-neutral-50">{customer.name}</h3>
                                        <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                            {customer.loyaltyPoints} Pts
                                        </span>
                                    </div>
                                    <p className="text-sm font-mono text-neutral-600 dark:text-neutral-400 mb-4">{customer.phone}</p>
                                    <p className="text-xs text-neutral-500">Click to view local history</p>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* History Modal */}
                    {selectedCustomer && (
                        <CustomerHistoryModal
                            customer={selectedCustomer}
                            onClose={() => setSelectedCustomer(null)}
                        />
                    )}
                </div>
            </div>
        </main>
    );
}
