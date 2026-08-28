"use server";

import { prisma } from "@/lib/prisma";

export async function getCompletedSales() {
    return prisma.sale.findMany({
        where: { status: "COMPLETED" },
        include: {
            items: {
                include: { product: true }
            },
            customer: true,
            employee: true
        },
        orderBy: { createdAt: "desc" }
    });
}
