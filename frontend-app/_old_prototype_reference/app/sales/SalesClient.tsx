"use client";

import { useState } from "react";

export default function SalesClient({ sales }: { sales: any[] }) {
    const [selectedSale, setSelectedSale] = useState<any | null>(null);

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm bg-white dark:bg-neutral-900">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Invoice ID</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Date</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Customer</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment Method</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Amount</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-neutral-500"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {sales.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-neutral-400">No sales history found.</td>
                                </tr>
                            )}
                            {sales.map(sale => (
                                <tr key={sale.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                                    <td className="px-5 py-3.5 font-bold text-neutral-900 dark:text-neutral-100 whitespace-nowrap">#{sale.id}</td>
                                    <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{new Date(sale.createdAt).toLocaleString()}</td>
                                    <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">{sale.customer ? sale.customer.name : "Walk-in"}</td>
                                    <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300`}>
                                            {sale.paymentMethod}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Rs. {sale.totalAmount}</td>
                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                        <button onClick={() => setSelectedSale(sale)} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View Items</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {selectedSale && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-800">
                            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-50">Invoice #{selectedSale.id}</h3>
                            <button onClick={() => setSelectedSale(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="mb-4">
                                <p className="text-xs text-neutral-500">Date: {new Date(selectedSale.createdAt).toLocaleString()}</p>
                                <p className="text-xs text-neutral-500">Cashier: {selectedSale.employee.name}</p>
                                {selectedSale.customer && <p className="text-xs text-neutral-500">Customer: {selectedSale.customer.name} ({selectedSale.customer.phone})</p>}
                            </div>
                            <table className="w-full text-sm mb-4">
                                <thead>
                                    <tr className="border-b border-neutral-200 dark:border-neutral-800">
                                        <th className="py-2 text-left text-xs text-neutral-500">Item</th>
                                        <th className="py-2 text-right text-xs text-neutral-500">Qty</th>
                                        <th className="py-2 text-right text-xs text-neutral-500">Price</th>
                                        <th className="py-2 text-right text-xs text-neutral-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSale.items.map((item: any) => (
                                        <tr key={item.id} className="border-b border-neutral-100 dark:border-neutral-800/50">
                                            <td className="py-2">{item.product?.name || "Unknown"}</td>
                                            <td className="py-2 text-right">{item.quantity}</td>
                                            <td className="py-2 text-right font-mono">Rs. {item.priceAtSale}</td>
                                            <td className="py-2 text-right font-mono">Rs. {item.priceAtSale * item.quantity}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="space-y-1 text-right text-sm border-t border-neutral-200 dark:border-neutral-800 pt-2">
                                <p className="text-neutral-500">Subtotal: Rs. {selectedSale.items.reduce((acc: number, item: any) => acc + item.priceAtSale * item.quantity, 0)}</p>
                                {selectedSale.tax > 0 && <p className="text-neutral-500">Tax: Rs. {selectedSale.tax}</p>}
                                {selectedSale.discount > 0 && <p className="text-emerald-500">Discount: - Rs. {selectedSale.discount}</p>}
                                <p className="font-bold text-lg mt-2 text-indigo-600 dark:text-indigo-400">Total: Rs. {selectedSale.totalAmount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
