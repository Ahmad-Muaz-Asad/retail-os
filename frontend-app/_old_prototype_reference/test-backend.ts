import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import assert from "node:assert";

const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function runTests() {
    console.log("🧪 Starting Backend Logic Tests...");

    // Test 1: POS transaction
    console.log("-> 🛒 Testing POS transaction (Stock deduction & Sale creation)");
    const productBefore = await prisma.product.findFirst({
        where: { stock: { gt: 0 } },
    });
    assert(productBefore, "No product found with stock > 0 for testing.");
    const employee = await prisma.employee.findFirst();
    assert(employee, "No employee found for testing.");
    const qtyToBuy = 1;

    // Perform transaction
    const sale = await prisma.$transaction(async (tx) => {
        const prod = await tx.product.update({
            where: { id: productBefore.id },
            data: { stock: { decrement: qtyToBuy } },
        });
        const newSale = await tx.sale.create({
            data: {
                totalAmount: prod.price * qtyToBuy,
                tax: 0,
                discount: 0,
                paymentMethod: "CASH",
                employeeId: employee.id,
                items: {
                    create: [{
                        productId: prod.id,
                        quantity: qtyToBuy,
                        priceAtSale: prod.price
                    }]
                }
            }
        });
        return newSale;
    });

    const productAfter = await prisma.product.findUnique({ where: { id: productBefore.id } });
    assert(productAfter?.stock === productBefore.stock - qtyToBuy, "Stock was not decremented correctly.");
    console.log("✅ POS transaction test passed!");

    // Test 2: Employee Clock-in/Clock-out
    console.log("-> ⏰ Testing Employee Clock-in/Clock-out");
    const testEmployee = await prisma.employee.findFirst();
    assert(testEmployee, "No employee found for attendance test.");

    const attendanceRecord = await prisma.attendance.create({
        data: {
            employeeId: testEmployee.id,
            clockIn: new Date(),
        }
    });
    assert(attendanceRecord.id, "Failed to create clock-in record.");

    const clockOutRecord = await prisma.attendance.update({
        where: { id: attendanceRecord.id },
        data: { clockOut: new Date() }
    });
    assert(clockOutRecord.clockOut !== null, "Failed to update clock-out time.");
    console.log("✅ Employee clock-in/out test passed!");

    // Test 3: Logging an Expense
    console.log("-> 💸 Testing Expense Logging");
    const expense = await prisma.expense.create({
        data: {
            amount: 1500,
            reason: "Internet Bill",
            employeeId: testEmployee.id
        }
    });
    assert(expense.id, "Failed to log expense.");

    const count = await prisma.expense.count({ where: { id: expense.id } });
    assert(count === 1, "Expense was not saved in DB.");
    console.log("✅ Expense logging test passed!");

    console.log("🎉 All backend tests passed successfully!");
}

runTests()
    .catch(e => {
        console.error("❌ Tests failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
