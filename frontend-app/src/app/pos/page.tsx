"use client";

import { useState, useRef, useEffect } from "react";
import { useProducts } from "@/lib/db/hooks";
import type { ProductDocument } from "@/lib/db/schemas";

type Product = ProductDocument & { id: string };

type CartItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    discount: number;
};

type Customer = {
    id: string;
    name: string;
    phone: string;
    loyaltyPoints: number;
};

type PaymentMethod = "CASH" | "CARD" | "SPLIT";

// ── Constants ─────────────────────────────────────────────────────────────────

const BACKEND = "http://localhost:4000";
const PAYMENT_METHODS: PaymentMethod[] = ["CASH", "CARD", "SPLIT"];

const CATEGORY_COLORS: Record<string, string> = {
    produce: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    dairy: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    meat: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    bakery: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    beverages: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    default: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
};

function getCategoryColor(category: string) {
    return CATEGORY_COLORS[category.toLowerCase()] ?? CATEGORY_COLORS.default;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function POSPage() {
    // Cart
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

    // Toast
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Loading
    const [isPending, setIsPending] = useState(false);

    // Customer / Tax / Loyalty-Discount states
    const [taxStr, setTaxStr] = useState<string>("");
    const [customerQuery, setCustomerQuery] = useState("");
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [discount, setDiscount] = useState<number>(0);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const comboboxRef = useRef<HTMLDivElement>(null);

    // Held carts
    const [heldCarts, setHeldCarts] = useState<any[]>([]);
    const [showHeld, setShowHeld] = useState(false);
    const [activeCartId, setActiveCartId] = useState<string | null>(null);

    // ── Products from RxDB (reactive via RxJS observable) ─────────────────────
    // useProducts() subscribes to db.products.find().$ and re-renders on any
    // local change. Also fires a background pullProducts() sync on mount.
    const products = useProducts();

    // Close suggestions on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ── Toast ──────────────────────────────────────────────────────────────────

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Cart helpers ───────────────────────────────────────────────────────────

    const addToCart = (product: Product) => {
        if (product.stock <= 0) return;
        setCart((prev) => {
            const existing = prev.find((c) => c.productId === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    showToast("error", `Cannot add more ${product.name}. Max stock reached.`);
                    return prev;
                }
                return prev.map((c) =>
                    c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [
                ...prev,
                {
                    productId: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    discount: product.defaultDiscount,
                },
            ];
        });
    };

    const updateQty = (productId: string, delta: number) => {
        setCart((prev) =>
            prev.map((c) => {
                if (c.productId === productId) {
                    const product = products.find((p) => p.id === productId);
                    const maxStock = product ? product.stock : 0;
                    const newQty = c.quantity + delta;
                    if (newQty > maxStock) {
                        showToast("error", `Max stock reached for ${c.name}.`);
                        return c;
                    }
                    return { ...c, quantity: newQty };
                }
                return c;
            }).filter((c) => c.quantity > 0)
        );
    };

    const removeItem = (productId: string) => {
        setCart((prev) => prev.filter((c) => c.productId !== productId));
    };

    const setItemDiscount = (productId: string, pct: number) => {
        setCart((prev) =>
            prev.map((c) =>
                c.productId === productId ? { ...c, discount: Math.min(100, Math.max(0, pct)) } : c
            )
        );
    };

    // ── Customer autocomplete ──────────────────────────────────────────────────

    const handleCustomerQueryChange = (value: string) => {
        setCustomerQuery(value);
        setShowSuggestions(true);
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        if (!value.trim()) {
            setCustomerSuggestions([]);
            return;
        }
        searchDebounceRef.current = setTimeout(async () => {
            // First: search the local RxDB customers collection (instant, offline-capable)
            try {
                const { getDB } = await import("@/lib/db/rxdb-setup");
                const db = await getDB();
                if (db) {
                    const q = value.trim().toLowerCase();
                    const allCustomers = await db.customers.find().exec();
                    const localResults = allCustomers.filter(c =>
                        c.name.toLowerCase().includes(q) || c.phone.includes(q)
                    ).slice(0, 8);

                    if (localResults.length > 0) {
                        setCustomerSuggestions(localResults.map((d) => d.toJSON() as Customer));
                        return; // found locally — no backend roundtrip needed
                    }
                }
            } catch { /* fall through to backend */ }

            // Fallback: query the backend (online mode)
            try {
                const res = await fetch(`${BACKEND}/api/crm/customers/search?q=${encodeURIComponent(value.trim())}`);
                const data = await res.json();
                setCustomerSuggestions(Array.isArray(data) ? data : []);
            } catch {
                setCustomerSuggestions([]);
            }
        }, 300);
    };

    const handleSelectSuggestion = async (suggestion: Customer) => {
        setIsLookingUp(true);
        setShowSuggestions(false);
        setCustomerSuggestions([]);
        setCustomerQuery(suggestion.name);
        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (db) {
                const cDoc = await db.customers.findOne(suggestion.id).exec();
                if (cDoc) {
                    const data = cDoc.toJSON();
                    setCustomer(data as unknown as Customer);
                    setDiscount(0);
                    showToast("success", `Customer ${data.name} found!`);
                    return;
                }
            }
            throw new Error("Could not fetch customer data locally.");
        } catch {
            showToast("error", "Could not fetch customer data.");
        } finally {
            setIsLookingUp(false);
        }
    };

    const handleApplyPoints = () => {
        if (customer && customer.loyaltyPoints > 0) {
            setDiscount(customer.loyaltyPoints);
            showToast("success", `Applied Rs ${customer.loyaltyPoints} discount!`);
        }
    };

    const handleClearCustomer = () => {
        setCustomer(null);
        setCustomerQuery("");
        setCustomerSuggestions([]);
        setDiscount(0);
    };

    // ── Totals ─────────────────────────────────────────────────────────────────

    const taxAmount = parseFloat(taxStr) || 0;
    const subtotal = cart.reduce(
        (sum, c) => sum + c.price * c.quantity * (1 - c.discount / 100),
        0
    );
    const total = Math.max(0, subtotal + taxAmount - discount);

    // ── Checkout / Hold ────────────────────────────────────────────────────────

    const handleAction = async (status: "COMPLETED" | "HOLD") => {
        if (cart.length === 0 || isPending) return;
        setIsPending(true);
        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db) throw new Error("Local database unavailable");

            const saleId = activeCartId || Math.random().toString(36).substring(2, 10);
            const now = new Date().toISOString();

            // 1. Insert into local RxDB first
            const localDoc = {
                id: saleId,
                totalAmount: total,
                subtotal: subtotal,
                tax: taxAmount,
                discount: discount,
                paymentMethod: paymentMethod,
                status: status,
                items: cart,
                customerId: customer?.id ?? null,
                employeeId: "emp_1", // Default local session employee
                createdAt: now,
                syncedAt: null,
                syncStatus: "PENDING" as "PENDING",
                updatedAt: now
            };

            await db.sales.upsert(localDoc as any);

            // Execute frontend loyalty math local cache
            if (status === "COMPLETED" && customer?.id) {
                const earned = Math.floor(total / 10);
                const cDoc = await db.customers.findOne(customer.id).exec();
                if (cDoc) {
                    let newPoints = cDoc.loyaltyPoints;
                    if (discount > 0) newPoints -= discount; // Redeemed
                    newPoints += earned;
                    await cDoc.patch({ loyaltyPoints: Math.max(0, newPoints), syncStatus: "PENDING" as "PENDING" });
                    const { pushPendingCustomers } = await import("@/lib/db/sync");
                    pushPendingCustomers(db).catch(console.error);
                }
            }

            // 2. Execute push sync immediately in the background
            const { pushPendingSales } = await import("@/lib/db/sync");
            pushPendingSales(db).catch(console.error);


            // 3. Clear UI
            setCart([]);
            setTaxStr("");
            setDiscount(0);
            setCustomer(null);
            setCustomerQuery("");
            setActiveCartId(null);
            showToast(
                "success",
                status === "HOLD" ? "Cart placed on hold locally!" : "Sale recorded successfully!"
            );
        } catch (error: any) {
            console.error("Action error:", error);
            showToast("error", "Action failed: " + error.message);
        } finally {
            setIsPending(false);
        }
    };

    const fetchHeldCarts = async () => {
        try {
            const { getDB } = await import("@/lib/db/rxdb-setup");
            const db = await getDB();
            if (!db) return;
            const held = await db.sales.find({ selector: { status: { $in: ["HOLD", "DRAFT"] } } }).exec();
            setHeldCarts(held.map(d => d.toJSON()));
        } catch {
            setHeldCarts([]);
            showToast("error", "Could not load held carts.");
        }
    };

    const handleResumeCart = (cartRecord: any) => {
        setCart(
            cartRecord.items.map((i: any) => ({
                productId: i.productId,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                discount: i.discount || 0,
            }))
        );
        if (cartRecord.customer) {
            setCustomer(cartRecord.customer);
            setCustomerQuery(cartRecord.customer.name);
        } else {
            setCustomer(null);
            setCustomerQuery("");
        }
        setTaxStr(cartRecord.tax?.toString() ?? "");
        setDiscount(cartRecord.discount ?? 0);
        setPaymentMethod(cartRecord.paymentMethod as PaymentMethod);
        setActiveCartId(String(cartRecord.id));
        setShowHeld(false);
        showToast("success", `Resumed cart #${cartRecord.id}`);
    };

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <main className="flex flex-col h-[calc(100vh-0px)]">
            {/* Page header */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0">
                <h1 className="text-sm font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">
                    Point of Sale
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    Live
                </span>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* ── Held Carts Modal ── */}
                {showHeld && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center p-4 border-b border-neutral-200 dark:border-neutral-800">
                                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-50">Held Carts</h3>
                                <button onClick={() => setShowHeld(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {heldCarts.length === 0 ? (
                                    <p className="text-sm text-neutral-500 text-center py-8">No held carts available.</p>
                                ) : (
                                    heldCarts.map((cart: any) => (
                                        <div key={cart.id} className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/50">
                                            <div>
                                                <p className="font-semibold text-sm">Cart #{cart.id} — Rs. {cart.totalAmount}</p>
                                                <p className="text-xs text-neutral-500">{new Date(cart.createdAt).toLocaleString()} • {cart.items.length} items</p>
                                            </div>
                                            <button onClick={() => handleResumeCart(cart)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700">
                                                Resume
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Toast ── */}
                {toast && (
                    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-xl text-sm font-medium transition-all
                        ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
                    >
                        {toast.type === "success" ? (
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        )}
                        {toast.message}
                    </div>
                )}

                {/* ══════════════ LEFT — Product Grid ══════════════ */}
                <div className="flex-1 overflow-y-auto bg-neutral-50 dark:bg-neutral-950 p-6">
                    <div className="mb-5 flex justify-between items-end">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">Products</h2>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">Click a card to add it to the cart</p>
                        </div>
                        <button
                            onClick={() => { fetchHeldCarts(); setShowHeld(true); }}
                            className="flex outline-none items-center gap-1.5 px-3 py-1.5 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            Resume Cart
                        </button>
                    </div>

                    {products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-neutral-400 text-sm">
                            <svg className="w-10 h-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
                            </svg>
                            No products found. Add some in Inventory first.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {products.map((p) => {
                                const outOfStock = p.stock === 0;
                                const inCart = cart.find((c) => c.productId === p.id);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        disabled={outOfStock}
                                        className={`relative group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
                                            ${outOfStock
                                                ? "opacity-40 cursor-not-allowed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                                                : inCart
                                                    ? "border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 shadow-md shadow-indigo-100 dark:shadow-indigo-900/20"
                                                    : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md hover:shadow-indigo-50 dark:hover:shadow-indigo-900/10 active:scale-95"
                                            }`}
                                    >
                                        {inCart && (
                                            <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white shadow">
                                                {inCart.quantity}
                                            </span>
                                        )}
                                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getCategoryColor(p.category)}`}>
                                            {p.category}
                                        </span>
                                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                                            {p.name}
                                        </span>
                                        <div className="flex w-full items-end justify-between mt-auto">
                                            <span className="text-base font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                                                Rs. {p.price.toFixed(0)}
                                            </span>
                                            <div className="flex flex-col items-end gap-0.5">
                                                {p.defaultDiscount > 0 && (
                                                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                                                        {p.defaultDiscount}% off
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-medium ${p.stock <= 10 && p.stock > 0 ? "text-amber-500" : "text-neutral-400 dark:text-neutral-500"}`}>
                                                    {outOfStock ? "Out" : `${p.stock} ${p.uom}`}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ══════════════ RIGHT — Cart ══════════════ */}
                <div className="w-[380px] shrink-0 flex flex-col border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    {/* Cart header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                        <div>
                            <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-50">Cart</h2>
                            <p className="text-xs text-neutral-400 dark:text-neutral-500">{cart.length} line item{cart.length !== 1 ? "s" : ""}</p>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className="text-xs text-neutral-400 dark:text-neutral-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Cart items */}
                    <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-300 dark:text-neutral-600 text-xs gap-2 py-12">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.943-7.143a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                                </svg>
                                Cart is empty
                            </div>
                        ) : (
                            cart.map((item) => {
                                const lineTotal = item.price * item.quantity * (1 - item.discount / 100);
                                const originalTotal = item.price * item.quantity;
                                return (
                                    <div key={item.productId} className="px-4 pt-3 pb-3">
                                        {/* Line header */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">{item.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {item.discount > 0 ? (
                                                        <>
                                                            <span className="text-xs text-neutral-400 line-through font-mono">Rs. {originalTotal.toFixed(0)}</span>
                                                            <span className="text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400">Rs. {lineTotal.toFixed(0)}</span>
                                                            <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full px-1.5 py-0.5">
                                                                −{item.discount}%
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
                                                            Rs. {item.price.toFixed(0)} × {item.quantity} = <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Rs. {lineTotal.toFixed(0)}</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Qty stepper */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => updateQty(item.productId, -1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 text-xs font-bold transition-colors active:scale-90"
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>
                                                <span className="w-5 text-center text-xs font-semibold text-neutral-800 dark:text-neutral-200 tabular-nums">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQty(item.productId, 1)}
                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-colors active:scale-90"
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                                <button
                                                    onClick={() => removeItem(item.productId)}
                                                    className="ml-1 w-5 h-5 flex items-center justify-center rounded-full text-neutral-300 dark:text-neutral-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    aria-label="Remove item"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* ── Discount UI ── */}
                                        <div className="mt-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl px-3 py-2.5 space-y-2">
                                            {/* Slider row */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 shrink-0 w-14">
                                                    Discount
                                                </span>
                                                <input
                                                    type="range"
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    value={item.discount}
                                                    onChange={(e) => setItemDiscount(item.productId, Number(e.target.value))}
                                                    className="flex-1 h-1.5 accent-indigo-600 cursor-pointer"
                                                />
                                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 w-8 text-right tabular-nums">
                                                    {item.discount}%
                                                </span>
                                            </div>
                                            {/* Quick-select approval buttons */}
                                            <div className="flex gap-1.5">
                                                {([
                                                    { label: "VIP", pct: 50, color: "bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50" },
                                                    { label: "Preferred", pct: 30, color: "bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50" },
                                                    { label: "Acquaintance", pct: 15, color: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50" },
                                                ] as const).map(({ label, pct, color }) => (
                                                    <button
                                                        key={label}
                                                        onClick={() => setItemDiscount(item.productId, pct)}
                                                        className={`flex-1 text-[9px] font-semibold rounded-lg py-1 transition-colors ${color} ${item.discount === pct ? "ring-1 ring-inset ring-current" : ""}`}
                                                    >
                                                        {label}<br />
                                                        <span className="font-bold">{pct}%</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Cart footer */}
                    <div className="border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 flex flex-col">
                        <div className="px-4 py-3 space-y-3">
                            {/* Customer Autocomplete Combobox */}
                            {!customer ? (
                                <div ref={comboboxRef} className="relative">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Search customer by name or phone…"
                                            value={customerQuery}
                                            onChange={(e) => handleCustomerQueryChange(e.target.value)}
                                            onFocus={() => customerQuery.trim() && setShowSuggestions(true)}
                                            className="flex-1 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {isLookingUp && (
                                            <span className="flex items-center px-2">
                                                <svg className="animate-spin w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                            </span>
                                        )}
                                    </div>
                                    {showSuggestions && customerQuery.trim() && (
                                        <div className="absolute bottom-full left-0 right-0 mb-1 z-50 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl overflow-hidden">
                                            {customerSuggestions.length === 0 ? (
                                                <div className="px-3 py-2.5 text-xs text-neutral-400 dark:text-neutral-500 text-center">No customers found</div>
                                            ) : (
                                                customerSuggestions.map((s) => (
                                                    <button
                                                        key={s.id}
                                                        onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                                                        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                                    >
                                                        <div>
                                                            <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-100">{s.name}</p>
                                                            <p className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">{s.phone}</p>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{s.loyaltyPoints} pts</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50 dark:border-indigo-900/30 dark:bg-indigo-900/10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs font-bold text-indigo-900 dark:text-indigo-100">{customer.name}</p>
                                            <p className="text-[10px] text-indigo-700/70 dark:text-indigo-300/70">{customer.phone}</p>
                                        </div>
                                        <button onClick={handleClearCustomer} className="text-[10px] text-red-500 hover:underline">Remove</button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-indigo-800 dark:text-indigo-300">
                                            Pts: <strong className="font-mono">{customer.loyaltyPoints}</strong>
                                        </span>
                                        {customer.loyaltyPoints > 0 && discount === 0 && (
                                            <button
                                                onClick={handleApplyPoints}
                                                className="px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 rounded shadow-sm hover:bg-indigo-700 transition"
                                            >
                                                Apply Discount
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Totals Breakdown */}
                            <div className="space-y-1.5 pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                                <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
                                    <span>Subtotal <span className="text-[10px] opacity-60">(after item discounts)</span></span>
                                    <span className="font-mono">Rs. {subtotal.toFixed(0)}</span>
                                </div>

                                {/* Tax Row */}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-500 dark:text-neutral-400">Tax Amount</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={taxStr}
                                        onChange={(e) => setTaxStr(e.target.value)}
                                        placeholder="0"
                                        className="w-20 text-right rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-2 py-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Loyalty Discount Row */}
                                {discount > 0 && (
                                    <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                        <span>Discount (Points)</span>
                                        <span className="font-mono">- Rs. {discount.toFixed(0)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-neutral-200/60 dark:border-neutral-800">
                                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wide">Total</span>
                                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">Rs. {total.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Actions Panel */}
                        <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                            <div className="relative">
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                                    className="w-full appearance-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    {PAYMENT_METHODS.map((m) => (
                                        <option key={m} value={m}>{m} Payment</option>
                                    ))}
                                </select>
                                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction("HOLD")}
                                    disabled={cart.length === 0 || isPending}
                                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 text-neutral-700 dark:text-neutral-300 text-sm font-semibold px-2 py-3 transition-all duration-150 active:scale-95"
                                >
                                    <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Hold
                                </button>
                                <button
                                    onClick={() => handleAction("COMPLETED")}
                                    disabled={cart.length === 0 || isPending}
                                    className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 transition-all duration-150 active:scale-95 shadow-md shadow-indigo-200 dark:shadow-indigo-900/30"
                                >
                                    {isPending ? (
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Checkout
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
