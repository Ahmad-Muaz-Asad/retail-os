import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Retail OS",
  description: "Main dashboard for Retail OS showing KPIs, low stock, and transactions.",
};

// SVG Icons
const Icons = {
  Currency: () => (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5 text-indigo-500">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"></path>
    </svg>
  ),
  Wallet: () => (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5 text-emerald-500">
      <path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-5z"></path>
      <path d="M16 12h5M19 12a2 2 0 100-4 2 2 0 000 4z"></path>
    </svg>
  ),
  Box: () => (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5 text-amber-500">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"></path>
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"></path>
    </svg>
  ),
  Users: () => (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-5 h-5 text-blue-500">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"></path>
    </svg>
  ),
  AlertAlert: () => (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" className="w-4 h-4 text-red-500">
      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>
  )
};

export default async function Dashboard() {
  // 1. Fetch live data from Prisma (running in parallel for better performance)
  const [
    salesAggr,
    expensesAggr,
    totalProducts,
    totalEmployees,
    lowStockProducts,
    recentSales
  ] = await Promise.all([
    prisma.sale.aggregate({ _sum: { totalAmount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true } }),
    prisma.product.count(),
    prisma.employee.count(),
    prisma.product.findMany({
      where: { stock: { lt: 10 } },
      orderBy: { stock: "asc" }
    }),
    prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { employee: true, customer: true }
    })
  ]);

  const totalSales = salesAggr._sum.totalAmount || 0;
  const totalExpenses = expensesAggr._sum.amount || 0;
  const expectedCash = totalSales - totalExpenses;

  // Currency formatting utility for PKR
  const formatPKR = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <main className="flex flex-col flex-1 p-6 lg:p-8 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">Retail Analytics Dashboard</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Real-time store performance & insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pos"
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Go to POS
          </Link>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Sales */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Sales</p>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg">
              <Icons.Currency />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-4 tracking-tight">{formatPKR(totalSales)}</p>
        </div>

        {/* Expected Cash */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Expected Cash</p>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
              <Icons.Wallet />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">{formatPKR(expectedCash)}</p>
          </div>
        </div>

        {/* Total Products */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Products</p>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-lg">
              <Icons.Box />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-4 tracking-tight">{totalProducts}</p>
        </div>

        {/* Active Employees */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Staff</p>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
              <Icons.Users />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-4 tracking-tight">{totalEmployees}</p>
        </div>
      </div>

      {/* Bottom Section: Low Stock & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Low Stock Alerts */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
            <Icons.AlertAlert />
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Low Stock Alerts</h2>
            <span className="ml-auto inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
              {lowStockProducts.length} items
            </span>
          </div>
          <div className="flex-1 overflow-auto p-0">
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-neutral-500">
                <span className="text-sm">All products are well stocked.</span>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs uppercase text-neutral-500 sticky top-0 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">Product Name</th>
                    <th scope="col" className="px-6 py-3 font-medium">Category</th>
                    <th scope="col" className="px-6 py-3 font-medium text-right">Current Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {lowStockProducts.map(product => (
                    <tr key={product.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-200">{product.name}</td>
                      <td className="px-6 py-4">{product.category}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${product.stock === 0
                            ? 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/30 dark:text-red-400 dark:ring-red-500/20'
                            : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/30 dark:text-amber-400 dark:ring-amber-500/20'
                          }`}>
                          {product.stock} {product.uom}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col h-[400px]">
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Recent Transactions</h2>
            <Link href="/reports/sales" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">View All &rarr;</Link>
          </div>
          <div className="flex-1 overflow-auto p-0">
            {recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-neutral-500">
                <span className="text-sm">No recent transactions.</span>
              </div>
            ) : (
              <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs uppercase text-neutral-500 sticky top-0 border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-medium">Time / ID</th>
                    <th scope="col" className="px-6 py-3 font-medium">Customer / Cashier</th>
                    <th scope="col" className="px-6 py-3 font-medium">Method</th>
                    <th scope="col" className="px-6 py-3 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {recentSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">#{sale.id.toString().padStart(4, '0')}</div>
                        <div className="text-xs text-neutral-400">{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">{sale.customer?.name || 'Walk-in'}</div>
                        <div className="text-xs text-neutral-400">By {sale.employee.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset ${sale.paymentMethod === 'CASH' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20' :
                            sale.paymentMethod === 'CARD' ? 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/20' :
                              'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20'
                          }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-neutral-900 dark:text-neutral-100">
                        {formatPKR(sale.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
