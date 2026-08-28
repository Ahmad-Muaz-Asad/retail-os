# Retail OS — Product Requirements Document

## Project Vision
A modular, local-first Retail OS for small-to-medium Pakistani retail shops. Built in phases, progressing from core CRUD & POS to AI-powered analytics.

## Tech Stack
- **Frontend / Backend:** Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Database:** Prisma ORM + SQLite (local), migrating to PostgreSQL for production
- **AI Layer:** Groq API (LLM) + RAG on structured store data

---

## Module Map (from Functional Decomposition)

| # | Module | Status |
|---|---|---|
| 1.0 | Inventory & Supply Chain | 🟡 In Progress |
| 2.0 | Point of Sale & Checkout | 🟡 In Progress |
| 3.0 | HR & Employee Management | ⬜ Planned |
| 4.0 | Finance & Reporting | ⬜ Planned |
| 5.0 | AI & RAG Layer | ⬜ Planned |

---

## Phase 1 — Foundation (✅ Complete)

**Goal:** Initialize the database, scaffold global navigation, and ship working Inventory and POS modules.

### 1.1 Database & Schema (`prisma/schema.prisma`)
- [x] `Product` model — id, name, price, stock, category, uom, timestamps
- [x] `Employee` model — id, name, role (ADMIN / MANAGER / CASHIER)
- [x] `Sale` model — totalAmount, paymentMethod (CASH / CARD / SPLIT), linked to Employee
- [x] `SaleItem` model — quantity, priceAtSale, linked to Sale & Product
- [x] Seed script (`prisma/seed.ts`) with 15 Pakistani grocery products, 3 employees, 3 demo sales

### 1.2 Inventory Module (`/inventory`) — Decomp §1.1, §1.2
- [x] Product catalogue table (Name, Category, UOM, Price in Rs., Stock badge)
- [x] "Add New Product" inline form (name, price, stock, category, uom)
- [x] Server Action — `addProduct` with validation + `revalidatePath`
- [x] Stock badges: 🟢 In Stock / 🟡 Low (≤10) / 🔴 Out of Stock

### 1.3 Point of Sale Module (`/pos`) — Decomp §2.1, §2.2
- [x] Product grid (tap-to-add)
- [x] Cart with quantity stepper, remove, clear all
- [x] Payment method selector (CASH / CARD / SPLIT)
- [x] Checkout → `processCheckout` Server Action → creates Sale + SaleItems, deducts stock
- [x] Toast notifications (success / error)

### 1.4 Project Structure
- [x] Global Sidebar navigation (Dashboard, Inventory, POS, Employees)
- [x] Active-link highlighting, mobile-responsive (icon-only on small screens)
- [x] PKR (Rs.) currency throughout — no USD
- [x] `/employees` placeholder page (no 404)

---

## Phase 2 — Advanced Database & Dashboards (⬜ Next)

**Goal:** Build the Finance module and a real Dashboard with analytics. Extend the Inventory module with advanced stock tracking.

### 2.1 Dashboard (`/`) — Decomp §4.2
- [ ] KPI cards: Today's Revenue, Total Sales count, Low-Stock items, Top Product
- [ ] Daily/Weekly sales chart (line or bar)
- [ ] Best-selling and worst-selling product report

### 2.2 Finance & EOD Module — Decomp §4.1
- [ ] End-of-Day (EOD) cash reconciliation form (Expected vs. Actual cash)
- [ ] Shop expense logging (petty cash, repairs, etc.)
- [ ] Shift summary report (total sales, payment method breakdown)

### 2.3 Advanced Inventory — Decomp §1.2, §1.3
- [ ] Edit & Delete product from Inventory table
- [ ] Manual stock adjustment (audit / correction) with reason note
- [ ] Low-stock alert banner/notification system (threshold configurable per product)
- [ ] Purchase order / "Receive Delivery" flow (Decomp §1.3.2) — record inbound stock with supplier note

### 2.4 Advanced POS — Decomp §2.1, §2.3
- [ ] Product search / barcode text input on POS screen (Decomp §2.1.1)
- [ ] Hold & Resume cart (Decomp §2.1.3)
- [ ] Discount application — flat Rs. amount or % (Decomp §2.3.1)
- [ ] Customer profile lookup by phone + loyalty points display (Decomp §2.3.2, §2.3.3)
- [ ] Digital invoice / receipt view after checkout (Decomp §2.1.5)

---

## Phase 3 — HR & Reporting (⬜ Future)

**Goal:** Build out the Employee Management module and connect it to payroll and attendance.

### 3.1 Employee Management (`/employees`) — Decomp §3.1
- [ ] Employee list table (name, role, contact)
- [ ] Add / Edit / Deactivate employee
- [ ] Role-Based Access Control enforcement — restrict POS/Inventory actions by role

### 3.2 Attendance & Scheduling — Decomp §3.2
- [ ] Shift creation (start/end time, assigned employee)
- [ ] Manual clock-in / clock-out (biometric placeholder)
- [ ] Leave request and manager approval workflow

### 3.3 Payroll — Decomp §3.3
- [ ] Basic salary calculation (days worked × daily rate)
- [ ] Loan / advance salary deduction tracking
- [ ] Sales commission report per cashier

### 3.4 AI & RAG Layer — Decomp §5.1–§5.4
- [ ] Groq API integration — natural language → SQL query on store data
- [ ] Conversational analytics dashboard ("Why did sales drop on Friday?")
- [ ] Proactive anomaly alerts (sudden stock drop, cash discrepancy)
- [ ] RAG on HR documents / SOPs for employee policy chatbot