"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getProducts() {
    return prisma.product.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function addProduct(
    _prevState: { error?: string; success?: boolean },
    formData: FormData
): Promise<{ error?: string; success?: boolean }> {
    const name = formData.get("name") as string;
    const priceRaw = formData.get("price") as string;
    const stockRaw = formData.get("stock") as string;
    const category = formData.get("category") as string;
    const uom = formData.get("uom") as string;
    const defaultDiscountRaw = formData.get("defaultDiscount") as string;

    if (!name || !priceRaw || !stockRaw || !category || !uom) {
        return { error: "All fields are required." };
    }

    const price = parseFloat(priceRaw);
    const stock = parseInt(stockRaw, 10);
    const defaultDiscount = parseInt(defaultDiscountRaw || "0", 10);

    if (isNaN(price) || price < 0) {
        return { error: "Price must be a valid positive number." };
    }
    if (isNaN(stock) || stock < 0) {
        return { error: "Stock must be a valid positive integer." };
    }
    if (isNaN(defaultDiscount) || defaultDiscount < 0 || defaultDiscount > 100) {
        return { error: "Default discount must be between 0 and 100." };
    }

    try {
        await prisma.product.create({
            data: {
                name: name.trim(),
                price,
                stock,
                category: category.trim(),
                uom: uom.trim(),
                defaultDiscount,
            },
        });
    } catch {
        return { error: "Failed to save product. Please try again." };
    }

    revalidatePath("/inventory");
    return { success: true };
}

export async function updateProductDiscount(
    productId: number,
    defaultDiscount: number
): Promise<{ success?: boolean; error?: string }> {
    if (defaultDiscount < 0 || defaultDiscount > 100) {
        return { error: "Discount must be between 0 and 100." };
    }
    try {
        await prisma.product.update({
            where: { id: productId },
            data: { defaultDiscount },
        });
        revalidatePath("/inventory");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function addStock(productId: number, quantity: number): Promise<{ success?: boolean; error?: string }> {
    if (quantity <= 0) return { error: "Quantity must be positive" };
    try {
        await prisma.product.update({
            where: { id: productId },
            data: { stock: { increment: quantity } }
        });
        revalidatePath("/inventory");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function updateProduct(
    productId: number,
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    const name = (formData.get("name") as string)?.trim();
    const priceRaw = formData.get("price") as string;
    const stockRaw = formData.get("stock") as string;
    const defaultDiscountRaw = formData.get("defaultDiscount") as string;

    if (!name) return { error: "Name is required." };
    const price = parseFloat(priceRaw);
    const stock = parseInt(stockRaw, 10);
    const defaultDiscount = parseInt(defaultDiscountRaw || "0", 10);

    if (isNaN(price) || price < 0) return { error: "Price must be a valid positive number." };
    if (isNaN(stock) || stock < 0) return { error: "Stock must be a valid non-negative integer." };
    if (isNaN(defaultDiscount) || defaultDiscount < 0 || defaultDiscount > 100)
        return { error: "Discount must be between 0 and 100." };

    try {
        await prisma.product.update({
            where: { id: productId },
            data: { name, price, stock, defaultDiscount },
        });
        revalidatePath("/inventory");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}

export async function deleteProduct(
    productId: number
): Promise<{ success?: boolean; error?: string }> {
    try {
        // Delete SaleItem rows first to preserve Sale (revenue) history
        await prisma.saleItem.deleteMany({ where: { productId } });
        await prisma.product.delete({ where: { id: productId } });
        revalidatePath("/inventory");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
