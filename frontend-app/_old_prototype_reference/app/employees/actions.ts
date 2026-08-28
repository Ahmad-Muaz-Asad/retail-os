"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

export async function addEmployee(formData: FormData) {
    const name = formData.get("name") as string;
    const roleValue = formData.get("role") as string;

    if (!name || name.trim() === "") {
        throw new Error("Employee name is required.");
    }

    if (!roleValue || !Object.keys(Role).includes(roleValue)) {
        throw new Error("Invalid role provided.");
    }

    await prisma.employee.create({
        data: {
            name: name.trim(),
            role: roleValue as Role,
        }
    });

    revalidatePath("/employees");
}

export async function clockIn(employeeId: number) {
    // Check if employee is already clocked in today without clocking out
    const openAttendance = await prisma.attendance.findFirst({
        where: {
            employeeId,
            clockOut: null,
        }
    });

    if (openAttendance) {
        throw new Error("Employee is already clocked in.");
    }

    await prisma.attendance.create({
        data: {
            employeeId,
            clockIn: new Date(),
        }
    });

    revalidatePath("/employees");
}

export async function clockOut(attendanceId: number) {
    await prisma.attendance.update({
        where: { id: attendanceId },
        data: {
            clockOut: new Date()
        }
    });

    revalidatePath("/employees");
}

export async function deleteEmployee(
    id: number
): Promise<{ success?: boolean; error?: string }> {
    try {
        // Delete dependent records first (attendance & expenses)
        await prisma.attendance.deleteMany({ where: { employeeId: id } });
        await prisma.expense.deleteMany({ where: { employeeId: id } });
        // Sales reference employeeId (required FK) — block deletion if any exist
        const salesCount = await prisma.sale.count({ where: { employeeId: id } });
        if (salesCount > 0) {
            return { error: `Cannot delete: this employee has ${salesCount} sale record(s). Sales history must be preserved.` };
        }
        await prisma.employee.delete({ where: { id } });
        revalidatePath("/employees");
        return { success: true };
    } catch (err: any) {
        return { error: err.message };
    }
}
