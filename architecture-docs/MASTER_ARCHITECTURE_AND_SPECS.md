# Retail OS: Enterprise Master Architecture & Specification

## 1. System Overview & Tech Stack
We are building a multi-tenant, offline-first SaaS Retail ERP. 
- **Frontend Client:** Next.js (App Router), TypeScript, Tailwind CSS (Configured as PWA).
- **Offline Engine:** RxDB (Browser-based, JSON document storage for zero-latency offline operations).
- **Backend Microservices:** Node.js, Express, TypeScript (Structured for eventual AWS Lambda deployment).
- **Cloud Database:** Amazon DynamoDB (Single-Table Design).
- **Event Bus:** AWS EventBridge/SQS for decoupling domains.

## 2. The "Old Prototype" Rule (Crucial for UI)
When asked to build frontend pages, you will be provided with files from an `_old_prototype_reference`. 
- **WHAT TO KEEP:** You must reuse the Tailwind CSS classes, component layouts, and visual design from these old files.
- **WHAT TO DISCARD:** The old prototype used Next.js Server Actions, Prisma ORM, and SQLite. You MUST completely strip out all Prisma logic and Server Actions. Replace them with standard React State, RxDB local queries, and standard `fetch()` API calls to our Node.js backend.

## 3. DynamoDB Single-Table Design (Multi-Tenancy)
To prevent cross-tenant data leakage, ALL database queries MUST include the Tenant ID.
- **Partition Key (PK):** `TENANT#<shop_id>`
- **Sort Key (SK):** Identifies the entity:
  - `PRODUCT#<uuid>`
  - `CUSTOMER#<phone_number>`
  - `EMPLOYEE#<uuid>`
  - `SALE#<timestamp>#<uuid>`
  - `EXPENSE#<timestamp>#<uuid>`

## 4. Domain 1: Inventory & Procurement
- **Catalog CRUD:** Add, Edit, Delete, Read. ALL Delete actions must have a JS confirmation modal ("Are you sure?").
- **Fields:** Name, Price, Stock, Category, Unit of Measure (UoM).
- **Default Discount:** A `defaultDiscount` integer (0-100) field that auto-applies at POS.
- **UX Features:** Dashboard low-stock alerts (< 10). Quick "Restock" button on inventory table rows to easily add `+X` quantity.

## 5. Domain 2: Point of Sale (POS) & Checkout
- **Strict Logic:** Negative stock is strictly forbidden. 
- **Cart Features:** Add/remove items, update quantities, automated tax calculation, split payments (Cash/Card), and Hold/Resume cart functionality.
- **Granular Discounts (UI Requirement):** 
  - Every cart item must have a 0-100% slider (defaulting to the product's `defaultDiscount`).
  - Below the slider, include 3 quick-select buttons: "VIP (50%)", "Preferred (30%)", and "Acquaintance (15%)". Clicking these updates the slider and recalculates the total instantly.

## 6. Domain 3: Customer CRM
- **POS Autocomplete:** The POS checkout must have a searchable dropdown. Typing a name/phone filters local customers instantly.
- **CRM Directory:** A `/customers` page showing profiles, Loyalty Points, and a viewable history of past receipts/Invoices.
- **Sales History:** A dedicated `/sales` page listing all receipts with their unique Invoice IDs and a modal to view exact `SaleItem`s.

## 7. Domain 4: HR & Finance
- **RBAC:** Platform Admin > Shop Owner > Manager > Cashier.
- **Attendance & Finance:** Clock In/Out buttons. UI for logging daily shop expenses (amount, reason). Dashboard EOD calculation ("Expected Cash" = Cash Sales - Cash Expenses).

## 8. Fault Tolerance & AI Layer
- **Decoupling:** If HR fails, POS must stay online. Offline transactions queue in RxDB and sync via AWS API Gateway when internet returns.
- **AI RAG (Phase 2):** The system will eventually integrate Groq API / AWS Bedrock for a Conversational Analytics Chatbot querying this data.