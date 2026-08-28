System Design & Requirements Blueprint
1. FUNCTIONAL DECOMPOSITION (Work Breakdown
Structure)
1.0 Inventory & Supply Chain Module
● 1.1 Product Catalog Management
○ 1.1.1 Add/Edit/Delete Product Master Data (Name, Cost, Price, VAT).
○ 1.1.2 Category & Sub-category Management.
○ 1.1.3 Unit of Measure (e.g., Pieces, Kg, Boxes).
○ 1.1.4 Barcode & QR Code Generation for unlabelled items.
○ 1.1.5 Bundling items.
● 1.2 Stock Movement & Tracking
○ 1.2.1 Real-time Stock Deduction (Sales integration).
○ 1.2.2 Real-time Stock Addition (Purchase Order integration).
○ 1.2.3 Manual Stock Adjustments (Audits).
○ 1.2.4 Customer Returns (Resalable vs. Damaged).
○ 1.2.5 Multi-Branch Stock Transfers (Request, Dispatch, Receive).
● 1.3 Procurement & Vendor Management
○ 1.3.1 Supplier Contacts (Saving phone numbers and details of vendors).
○ 1.3.2 Receiving Deliveries (Checking the boxes that arrived against what was ordered).
○ 1.3.3 Low Stock Alerts (Red warning when an item is about to run out).
○ 1.3.4 Batch / Expiry Date Tracker
2.0 Point of Sale (POS) & Checkout Module
● 2.1 Cart & Billing
○ 2.1.1 Add to Cart (via Scanner, Search, or Quick-Touch buttons).
○ 2.1.2 Cart modification (Update Qty, Remove, Clear).
○ 2.1.3 Hold/Resume Cart.
○ 2.1.4 Tax Calculation.
○ 2.1.5 Invoice Generation (Digital & Print).
● 2.2 Payment Processing
○ 2.2.1 Split Payments (e.g., $10 Cash, $20 Card).
○ 2.2.3 Khaata Management.
● 2.3 Promotions & Loyalty
○ 2.3.1 Discounts (Applying a 10% off sale, or a flat $5 discount).
○ 2.3.2 Customer Profiles (Saving customer phone numbers).
○ 2.3.3 Loyalty Points
○ 2.3.4 Item-Level Discounts — per-line-item % slider (0–100) with owner-approval quick-selects: VIP (50%), Preferred (30%), Acquaintance (15%). Slider defaults to the product's pre-set sale discount.
○ 2.3.5 Default Sale Discount per Product — set by Manager in Inventory (0–100%). Pre-fills the POS discount slider when the product is added to cart.
3.0 HR & Employee Management Module
● 3.1 Access & Identity
○ 3.1.1 Employee Onboarding (Profiles, ID, Emergency Contacts).
○ 3.1.2 Role-Based Access Control (Admin, Manager, Cashier).
● 3.2 Attendance & Scheduling
○ 3.2.1 Shifts Timinng Creation.
○ 3.2.2 Biometric Attendance.
○ 3.2.3 Leave Request & Approval Workflow.
● 3.3 Payroll & Performance
○ 3.3.1 Basic Salary Calculation (Days worked * Rate).
○ 3.3.2 Sales Commission Tracking.
○ 3.3.3 Loan/Advance Salary Deductions.
4.0 Finance & Reporting Module
● 4.1 Shift & Cash Management
○ 4.1.1 End-of-Day (EOD) Cash Reconciliation (Expected vs. Actual).
○ 4.1.2 Shop Expense logging.
● 4.2 Analytics & Dashboards
○ 4.2.1 Daily/Weekly/Monthly Sales Summaries.
○ 4.2.2 Best-Selling & Worst-Selling reports.
○ 4.2.3 Profit & Loss approximation.
5.0 AI & RAG Layer (AWS Bedrock / LLM Integration)
● 5.1 Conversational Analytics (Manager Agent)
○ 5.1.1 Natural language queries converting to Database SQL/NoSQL lookups.
○ 5.1.2 Automated Data Summarization.
● 5.2 Operational Support (Employee Agent)
○ 5.2.1 RAG on S3-stored HR Documents (Policy Chatbot).
○ 5.2.2 RAG on SOPs (Standard Operating Procedures) for training.
● 5.3 Proactive AI
○ 5.3.1 Anomaly Detection (e.g., "Alert: Sudden drop in sales for Item X").
● 5.4 Customer Side
○ 5.4.1 Online Ordering.
○ 5.4.2 Getting info as per Customer Profile
2. REAL-LIFE EXAMPLES (How it works in the shop)
These stories show exactly how shop workers will use the system every day.
Example 1: Making a Sale with Mixed Payment & Points (The Cashier)
1. The Cashier scans 3 items. The system shows the prices and takes the items out of
virtual stock.
2. The Customer asks to use their loyalty points. The Cashier types in the customer's
phone number.
3. The system shows the customer has 500 points.
4. The Cashier clicks "Apply Points" to give a Rs 100 discount. The total bill updates.
5. The Customer wants to pay Rs 5000 in Cash and Rs 7000 on a Credit Card.
6. The Cashier selects "Split Payment," types in $10 for Cash, and clicks Card for the rest.
7. The system prints the receipt and updates the customer's new point balance.
Example 2: Receiving a Delivery (The Manager)
1. A delivery truck drops off 50 boxes of Milk.
2. The Manager opens the system and clicks "Receive Delivery".
3. The Manager counts the boxes and sees that 2 boxes are broken.
4. Instead of 50, the Manager types "48" into the system and adds a note: "2 broken in
truck."
5. The Manager clicks "Confirm."
6. The system automatically adds 48 boxes to the shop's inventory and updates the
supplier's payment record so the shop doesn't pay for the broken ones.
Example 3: Closing the Shop at Night (Cashier & Manager)
1. At 10:00 PM, the Cashier clicks "End Shift."
2. The system calculates the money: Morning Cash + Total Sales today - Money spent on
tea = Expected Cash is Rs 50000.
3. The Cashier counts the actual paper money in the drawer and it's only Rs 48000. They
type "48000" into the system.
4. The system flashes a "$10 Shortage" warning.
5. The Manager is notified, checks the logs, and approves the closing. The system
remembers this shortage for the end-of-month salary review.
Example 4: Asking the AI for Help (The Owner)
1. The Owner is sitting at home and opens the AI Dashboard.
2. The Owner types: "Why did we make less money this Friday compared to last Friday?"
3. The AWS AI looks at all the sales and expense data.
4. The AI replies: "Your total sales were good, but profit was lower because you put all Milk
on a heavy discount, and someone took $50 out of the drawer to pay the repairman.