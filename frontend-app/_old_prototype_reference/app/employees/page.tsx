import { prisma } from "@/lib/prisma";
import EmployeeDashboardClient from "./EmployeeDashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "HR & Employees | Retail OS",
    description: "Manage staff directory and daily attendance.",
};

export default async function EmployeesPage() {
    // 1. Fetch all employees
    const employees = await prisma.employee.findMany({
        orderBy: { createdAt: "desc" },
    });

    // 2. Fetch today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    const todayAttendance = await prisma.attendance.findMany({
        where: {
            clockIn: {
                gte: today,
                lt: tomorrow,
            }
        },
        include: {
            employee: true
        },
        orderBy: {
            clockIn: "desc"
        }
    });

    return (
        <main className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <EmployeeDashboardClient
                employees={employees}
                todayAttendance={todayAttendance}
            />
        </main>
    );
}
