import { PrismaClient } from "@prisma/client";
import { processCheckout, lookupCustomer } from "../app/pos/actions";

const prisma = new PrismaClient();

async function run() {
    console.log("== Seeding test customer ==");
    let customer = await prisma.customer.findUnique({ where: { phone: "03001234567" } });
    if (!customer) {
        customer = await prisma.customer.create({
            data: { name: "Test Customer", phone: "03001234567", loyaltyPoints: 500 }
        });
    } else {
        await prisma.customer.update({
            where: { id: customer.id },
            data: { loyaltyPoints: 500 }
        });
        customer.loyaltyPoints = 500;
    }
    console.log("Customer ready:", customer);

    const products = await prisma.product.findMany({ take: 2 });
    if (products.length === 0) {
        console.log("No products in DB, cannot test. Run seed first.");
        process.exit(1);
    }
    const p1 = products[0];

    const initialStock = p1.stock;
    console.log(`Initial stock for ${p1.name}:`, initialStock);

    console.log("\n== Testing HOLD cart ==");
    await processCheckout([{ productId: p1.id, name: p1.name, price: p1.price, quantity: 1, discount: 0 }], "CASH", 50, 0, null, "HOLD");
    const p1AfterHold = await prisma.product.findUnique({ where: { id: p1.id } });
    console.log(`Stock after HOLD (should be ${initialStock}):`, p1AfterHold?.stock);

    console.log("\n== Testing COMPLETED cart with Discount and Tax ==");
    const customerFound = await lookupCustomer("03001234567");
    console.log("Looked up customer:", customerFound);

    // Apply 100 points discount
    await processCheckout([{ productId: p1.id, name: p1.name, price: p1.price, quantity: 1, discount: 0 }], "SPLIT", 20, 100, customer.id, "COMPLETED");
    const p1AfterComplete = await prisma.product.findUnique({ where: { id: p1.id } });
    console.log(`Stock after COMPLETED (should be ${initialStock - 1}):`, p1AfterComplete?.stock);

    const customerAfter = await prisma.customer.findUnique({ where: { id: customer.id } });
    console.log(`Customer points after (should be 400):`, customerAfter?.loyaltyPoints);

    console.log("\n== Done ==");
}

run().catch(console.error).finally(() => prisma.$disconnect());
