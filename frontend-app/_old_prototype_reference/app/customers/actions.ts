"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
    return prisma.customer.findMany({
        include: {
            sales: {
                include: {
                    items: {
                        include: { product: true }
                    },
                    employee: true
                },
                orderBy: { createdAt: "desc" }
            }
        },
        orderBy: { name: "asc" }
    });
}

export async function addCustomer(
    formData: FormData
): Promise<{ success?: boolean; error?: string }> {
    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();

    if (!name || !phone) return { error: "Name and phone are required." };

    try {
        await prisma.customer.create({ data: { name, phone } });
        revalidatePath("/customers");
        return { success: true };
    } catch (err: any) {
        if (err.code === "P2002") return { error: "A customer with this phone number already exists." };
        return { error: err.message };
    }
}

export async function deleteCustomer(
    id: number
): Promise<{ success?: boolean; error?: string }> {
    try {
        await prisma.customer.delete({ where: { id } });
        revalidatePath("/customers");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
