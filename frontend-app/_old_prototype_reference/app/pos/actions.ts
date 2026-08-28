"use server";

import { prisma } from "@/lib/prisma";

export interface CartItem {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    discount: number; // item-level discount percentage (0–100)
}

export async function getProducts() {
    return prisma.product.findMany({
        orderBy: { name: "asc" },
    });
}

export async function lookupCustomer(phone: string) {
    if (!phone) return null;
    return prisma.customer.findUnique({
        where: { phone },
    });
}

export async function searchCustomers(query: string) {
    if (!query || query.trim().length < 1) return [];
    const q = query.trim();
    return prisma.customer.findMany({
        where: {
            OR: [
                { name: { contains: q } },
                { phone: { contains: q } },
            ],
        },
        take: 8,
        orderBy: { name: "asc" },
    });
}

export async function getHeldCarts() {
    return prisma.sale.findMany({
        where: { status: "HOLD" },
        include: {
            items: { include: { product: true } },
            customer: true,
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function processCheckout(
    items: CartItem[],
    paymentMethod: "CASH" | "CARD" | "SPLIT",
    tax: number = 0,
    discount: number = 0,
    customerId: number | null = null,
    status: "COMPLETED" | "HOLD" = "COMPLETED",
    saleId?: number
): Promise<{ success: boolean; error?: string }> {
    if (!items.length) return { success: false, error: "Cart is empty." };

    // Subtotal factors in per-item discounts
    const subtotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity * (1 - item.discount / 100),
        0
    );
    const totalAmount = Math.max(0, subtotal + tax - discount);

    try {
        await prisma.$transaction(async (tx) => {
            // Ensure at least one employee exists (dummy cashier)
            let employee = await tx.employee.findFirst({ where: { role: "CASHIER" } });
            if (!employee) {
                employee = await tx.employee.create({
                    data: { name: "Cashier", role: "CASHIER" },
                });
            }

            if (saleId) {
                await tx.saleItem.deleteMany({ where: { saleId } });
                await tx.sale.delete({ where: { id: saleId } });
            }

            // Create the Sale record
            const sale = await tx.sale.create({
                data: {
                    totalAmount,
                    tax,
                    discount,
                    paymentMethod,
                    status,
                    employeeId: employee.id,
                    ...(customerId != null && { customerId }),
                },
            });

            // Create SaleItem records — store the effective (discounted) price
            await tx.saleItem.createMany({
                data: items.map((item) => ({
                    saleId: sale.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtSale: item.price * (1 - item.discount / 100),
                })),
            });

            if (status === "COMPLETED") {
                // Verify all stock before modifying anything
                for (const item of items) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product) {
                        throw new Error(`Product missing: ${item.name}`);
                    }
                    if (product.stock < item.quantity) {
                        throw new Error(`Insufficient stock for ${item.name} (Available: ${product.stock})`);
                    }
                }

                // Decrement stock for each product
                for (const item of items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } },
                    });
                }

                // Deduct loyalty points (assuming 1 point = Rs 1 discount)
                if (customerId != null && discount > 0) {
                    await tx.customer.update({
                        where: { id: customerId },
                        data: { loyaltyPoints: { decrement: discount } },
                    });
                }
            }
        });

        return { success: true };
    } catch (err: any) {
        console.error("processCheckout error:", err);
        return { success: false, error: err?.message || "Checkout failed. Please try again." };
    }
}
