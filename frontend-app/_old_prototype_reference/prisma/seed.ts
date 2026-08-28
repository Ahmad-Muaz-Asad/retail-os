import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding database…");

    // ── Clear in FK-safe order ──────────────────────────────────────────────
    await prisma.attendance.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.product.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.supplier.deleteMany();
    console.log("🗑  Cleared existing data");

    // ── Suppliers ───────────────────────────────────────────────────────────
    const suppliers = await prisma.supplier.createManyAndReturn({
        data: [
            { name: "Al-Madina Grains", phone: "0300-1234567", email: "almadina@grains.pk", notes: "Main wheat & rice supplier. Delivers every Monday." },
            { name: "Haji Dairy Farm", phone: "0333-9876543", notes: "Fresh buffalo milk. Order before 6 AM for morning delivery." },
            { name: "Rauf Spice Traders", phone: "0321-5556677", email: "rauf@spices.pk", notes: "Bulk spices at wholesale rate. Min order 10 kg." },
            { name: "Faisal Beverages Supply", phone: "0300-5554433", email: "faisal@bevall.com", notes: "Soft drinks and juices." },
            { name: "Sachal Household Distribution", phone: "0311-9988776", notes: "Soaps, detergents, cleaning tools." }
        ],
    });
    console.log(`✅ Inserted ${suppliers.length} suppliers`);

    // ── Customers ───────────────────────────────────────────────────────────
    const customers = await prisma.customer.createManyAndReturn({
        data: [
            { name: "Tariq Mehmood", phone: "0300-1111111", loyaltyPoints: 850 },
            { name: "Ayesha Bibi", phone: "0312-2222222", loyaltyPoints: 230 },
            { name: "Kamran Ahmed", phone: "0345-3333333", loyaltyPoints: 0 },
            { name: "Sana Zafar", phone: "0301-4444444", loyaltyPoints: 120 },
            { name: "Bilal Qureshi", phone: "0322-5555555", loyaltyPoints: 400 },
        ],
    });
    console.log(`✅ Inserted ${customers.length} customers`);

    // ── Products (15 realistic Pakistani items) ─────────────────────────────
    const products = await prisma.product.createManyAndReturn({
        data: [
            { name: "Basmati Rice (Super Kernel)", price: 320, stock: 150, category: "Grains", uom: "kg" },
            { name: "Atta (Wheat Flour)", price: 140, stock: 200, category: "Grains", uom: "kg" },
            { name: "Sunflower Oil", price: 490, stock: 80, category: "Cooking Oil", uom: "L" },
            { name: "Buffalo Milk", price: 170, stock: 60, category: "Dairy", uom: "L" },
            { name: "Desi Ghee", price: 2200, stock: 25, category: "Dairy", uom: "kg" },
            { name: "Eggs (Dozen)", price: 360, stock: 40, category: "Dairy", uom: "dozen" },
            { name: "Chicken (Broiler)", price: 560, stock: 30, category: "Meat", uom: "kg" },
            { name: "Red Lentils (Masoor Dal)", price: 290, stock: 90, category: "Pulses", uom: "kg" },
            { name: "Chickpeas (Chana)", price: 260, stock: 70, category: "Pulses", uom: "kg" },
            { name: "Iodised Salt", price: 60, stock: 200, category: "Spices", uom: "kg" },
            { name: "Red Chilli Powder", price: 480, stock: 45, category: "Spices", uom: "kg" },
            { name: "Turmeric Powder", price: 520, stock: 35, category: "Spices", uom: "kg" },
            { name: "Pepsi (1.5L)", price: 130, stock: 8, category: "Beverages", uom: "pcs" },
            { name: "Green Tea Bags (Lipton)", price: 450, stock: 0, category: "Beverages", uom: "box" },
            { name: "Surf Excel (Washing Powder)", price: 680, stock: 55, category: "Household", uom: "kg" },
            { name: "Lifebuoy Soap (120g)", price: 80, stock: 120, category: "Household", uom: "pcs" },
            { name: "Mutton (Mix)", price: 1800, stock: 5, category: "Meat", uom: "kg" },
            { name: "Beef (With Bone)", price: 900, stock: 2, category: "Meat", uom: "kg" },
            { name: "Tapal Danedar Tea (800g)", price: 1100, stock: 40, category: "Beverages", uom: "pack" },
            { name: "National Ketchup (800g)", price: 320, stock: 0, category: "Pantry", uom: "bag" },
        ],
    });
    console.log(`✅ Inserted ${products.length} products`);

    // ── Employees ───────────────────────────────────────────────────────────
    const employees = await prisma.employee.createManyAndReturn({
        data: [
            { name: "Ahmed Khan", role: "ADMIN" },
            { name: "Sara Malik", role: "MANAGER" },
            { name: "Raza Ali", role: "CASHIER" },
        ],
    });
    console.log(`✅ Inserted ${employees.length} employees`);

    const [admin, manager, cashier] = employees;

    // ── Attendance (2 records per employee — yesterday + today) ────────────
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const makeTime = (base: Date, h: number, m = 0) => {
        const d = new Date(base);
        d.setHours(h, m, 0, 0);
        return d;
    };

    const attendanceData = [
        // Yesterday
        { employeeId: admin.id, clockIn: makeTime(yesterday, 9, 0), clockOut: makeTime(yesterday, 18, 0) },
        { employeeId: manager.id, clockIn: makeTime(yesterday, 9, 15), clockOut: makeTime(yesterday, 18, 30) },
        { employeeId: cashier.id, clockIn: makeTime(yesterday, 8, 50), clockOut: makeTime(yesterday, 17, 55) },
        // Today (some still clocked in)
        { employeeId: admin.id, clockIn: makeTime(today, 9, 0), clockOut: makeTime(today, 13, 0) },
        { employeeId: manager.id, clockIn: makeTime(today, 9, 10), clockOut: null },
        { employeeId: cashier.id, clockIn: makeTime(today, 8, 55), clockOut: null },
    ];
    for (const a of attendanceData) {
        await prisma.attendance.create({ data: a });
    }
    console.log("✅ Inserted 6 attendance records");

    // ── Expenses ────────────────────────────────────────────────────────────
    const expenseData = [
        { amount: 500, reason: "Tea & refreshments for staff", employeeId: manager.id, date: makeTime(yesterday, 10) },
        { amount: 2500, reason: "AC repair (compressor issue)", employeeId: admin.id, date: makeTime(yesterday, 14) },
        { amount: 8000, reason: "Monthly electricity bill", employeeId: admin.id, date: makeTime(today, 11) },
        { amount: 300, reason: "Cleaning supplies", employeeId: cashier.id, date: makeTime(today, 9) },
        { amount: 750, reason: "Stationery (receipts, pens)", employeeId: manager.id, date: makeTime(today, 10) },
    ];
    for (const e of expenseData) {
        await prisma.expense.create({ data: e });
    }
    console.log("✅ Inserted 5 expenses");

    // ── Sales ───────────────────────────────────────────────────────────────
    const rice = products.find((p) => p.name.includes("Basmati"))!;
    const oil = products.find((p) => p.name.includes("Sunflower"))!;
    const milk = products.find((p) => p.name.includes("Milk"))!;
    const eggs = products.find((p) => p.name.includes("Eggs"))!;
    const dal = products.find((p) => p.name.includes("Masoor"))!;

    const salesData = [
        {
            totalAmount: rice.price * 2 + oil.price,
            tax: 85,
            discount: 100,
            paymentMethod: "CASH" as const,
            status: "COMPLETED" as const,
            employeeId: cashier.id,
            customerId: customers[0].id,
            items: [
                { productId: rice.id, quantity: 2, priceAtSale: rice.price },
                { productId: oil.id, quantity: 1, priceAtSale: oil.price },
            ],
        },
        {
            totalAmount: milk.price * 3 + eggs.price,
            tax: 50,
            discount: 0,
            paymentMethod: "CARD" as const,
            status: "COMPLETED" as const,
            employeeId: cashier.id,
            customerId: customers[1].id,
            items: [
                { productId: milk.id, quantity: 3, priceAtSale: milk.price },
                { productId: eggs.id, quantity: 1, priceAtSale: eggs.price },
            ],
        },
        {
            totalAmount: dal.price * 5,
            tax: 0,
            discount: 290,
            paymentMethod: "SPLIT" as const,
            status: "HOLD" as const,
            employeeId: cashier.id,
            customerId: null,
            items: [
                { productId: dal.id, quantity: 5, priceAtSale: dal.price },
            ],
        },
        {
            totalAmount: rice.price * 5,
            tax: 0,
            discount: 0,
            paymentMethod: "CASH" as const,
            status: "COMPLETED" as const,
            employeeId: cashier.id,
            customerId: customers[2].id,
            items: [
                { productId: rice.id, quantity: 5, priceAtSale: rice.price },
            ],
        },
        {
            totalAmount: milk.price * 2 + oil.price * 2,
            tax: 20,
            discount: 50,
            paymentMethod: "CARD" as const,
            status: "COMPLETED" as const,
            employeeId: cashier.id,
            customerId: customers[3].id,
            items: [
                { productId: milk.id, quantity: 2, priceAtSale: milk.price },
                { productId: oil.id, quantity: 2, priceAtSale: oil.price },
            ],
        },
        {
            totalAmount: eggs.price * 2,
            tax: 0,
            discount: 0,
            paymentMethod: "CASH" as const,
            status: "COMPLETED" as const,
            employeeId: manager.id,
            customerId: null,
            items: [
                { productId: eggs.id, quantity: 2, priceAtSale: eggs.price },
            ],
        },
        {
            totalAmount: dal.price * 10,
            tax: 150,
            discount: 0,
            paymentMethod: "SPLIT" as const,
            status: "COMPLETED" as const,
            employeeId: cashier.id,
            customerId: customers[4].id,
            items: [
                { productId: dal.id, quantity: 10, priceAtSale: dal.price },
            ],
        },
        {
            totalAmount: rice.price * 1 + milk.price * 1 + eggs.price * 1 + dal.price * 1,
            tax: 30,
            discount: 0,
            paymentMethod: "CARD" as const,
            status: "COMPLETED" as const,
            employeeId: cashier.id,
            customerId: customers[0].id,
            items: [
                { productId: rice.id, quantity: 1, priceAtSale: rice.price },
                { productId: milk.id, quantity: 1, priceAtSale: milk.price },
                { productId: eggs.id, quantity: 1, priceAtSale: eggs.price },
                { productId: dal.id, quantity: 1, priceAtSale: dal.price },
            ],
        },
        {
            totalAmount: oil.price * 5,
            tax: 100,
            discount: 0,
            paymentMethod: "SPLIT" as const,
            status: "HOLD" as const,
            employeeId: cashier.id,
            customerId: customers[1].id,
            items: [
                { productId: oil.id, quantity: 5, priceAtSale: oil.price },
            ],
        },
        {
            totalAmount: milk.price * 10,
            tax: 50,
            discount: 200,
            paymentMethod: "CASH" as const,
            status: "COMPLETED" as const,
            employeeId: cashier.id,
            customerId: customers[2].id,
            items: [
                { productId: milk.id, quantity: 10, priceAtSale: milk.price },
            ],
        },
    ];

    for (const sale of salesData) {
        const { items, ...saleFields } = sale;
        await prisma.sale.create({
            data: { ...saleFields, items: { create: items } },
        });
    }
    console.log(`✅ Inserted ${salesData.length} sales`);
    console.log("🎉 Seeding complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
