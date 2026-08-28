"use client";

import { useState } from "react";
import { Employee, Attendance, Role } from "@prisma/client";
import { addEmployee, clockIn, clockOut, deleteEmployee } from "./actions";
import { useRouter } from "next/navigation";

type EmployeeWithAttendance = Employee & {
    attendance: Attendance[];
};

type AttendanceWithEmployee = Attendance & {
    employee: Employee;
};

interface Props {
    employees: Employee[];
    todayAttendance: AttendanceWithEmployee[];
}

export default function EmployeeDashboardClient({ employees, todayAttendance }: Props) {
    const [activeTab, setActiveTab] = useState<"directory" | "attendance">("directory");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    async function handleAddEmployee(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            await addEmployee(formData);
            (e.target as HTMLFormElement).reset();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to add employee");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleClockIn(employeeId: number) {
        try {
            await clockIn(employeeId);
            router.refresh();
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to clock in");
        }
    }

    async function handleClockOut(attendanceId: number) {
        try {
            await clockOut(attendanceId);
            router.refresh();
        } catch (error) {
            alert("Failed to clock out");
        }
    }

    async function handleDeleteEmployee(emp: Employee) {
        if (!window.confirm(`Delete "${emp.name}" (${emp.role})? This is permanent.\n\nNote: employees with sales records cannot be deleted.`)) return;
        try {
            const result = await deleteEmployee(emp.id);
            if (result.error) {
                alert(result.error);
            } else {
                router.refresh();
            }
        } catch (error) {
            alert("Failed to delete employee.");
        }
    }

    return (
        <div className="flex flex-col flex-1 p-6 lg:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 tracking-tight">HR & Employee Management</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage staff directory and track daily attendance</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50 p-1 mb-8 w-max">
                <button
                    onClick={() => setActiveTab("directory")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "directory" ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                        }`}
                >
                    Staff Directory
                </button>
                <button
                    onClick={() => setActiveTab("attendance")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "attendance" ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow" : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
                        }`}
                >
                    Today's Attendance
                </button>
            </div>

            {/* DIRECTORY TAB */}
            {activeTab === "directory" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* List */}
                    <div className="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">All Employees</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">ID</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Name</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Role</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Joined</th>
                                        <th scope="col" className="px-6 py-3 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                                    {employees.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-6 py-4">#{emp.id.toString().padStart(4, '0')}</td>
                                            <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-200">{emp.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center rounded-md bg-indigo-50 dark:bg-indigo-950 px-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400 ring-1 ring-inset ring-indigo-600/20 dark:ring-indigo-500/20">
                                                    {emp.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{new Date(emp.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteEmployee(emp)}
                                                    className="inline-flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                                                >
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {employees.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">No employees found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add Form */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm h-fit">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Add New Employee</h2>
                        </div>
                        <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-neutral-900 dark:text-neutral-200 border-none mb-1">Full Name</label>
                                <input required type="text" name="name" id="name" className="block w-full rounded-md border-0 py-1.5 px-3 text-neutral-900 dark:text-neutral-100 dark:bg-neutral-950 shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 placeholder:text-neutral-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="e.g. Tariq Mehmood" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-neutral-900 dark:text-neutral-200 border-none mb-1">Role</label>
                                <select required name="role" id="role" className="block w-full rounded-md border-0 py-1.5 px-3 text-neutral-900 dark:text-neutral-100 dark:bg-neutral-950 shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6">
                                    <option value="CASHIER">Cashier</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 mt-2"
                            >
                                {isSubmitting ? "Adding..." : "Add Employee"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === "attendance" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Today's Log */}
                    <div className="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                        <div className="border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Live Attendance Log</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-neutral-600 dark:text-neutral-400">
                                <thead className="bg-neutral-50 dark:bg-neutral-900/50 text-xs uppercase text-neutral-500 border-b border-neutral-200 dark:border-neutral-800">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 font-medium">Employee</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Clock In</th>
                                        <th scope="col" className="px-6 py-3 font-medium">Clock Out</th>
                                        <th scope="col" className="px-6 py-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                                    {todayAttendance.map((record) => (
                                        <tr key={record.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                                            <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-200">{record.employee.name}</td>
                                            <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-medium">
                                                {new Date(record.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className={`px-6 py-4 font-medium ${record.clockOut ? 'text-neutral-900 dark:text-neutral-200' : 'text-amber-500 dark:text-amber-400'}`}>
                                                {record.clockOut ? new Date(record.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active Shift'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!record.clockOut && (
                                                    <button
                                                        onClick={() => handleClockOut(record.id)}
                                                        className="inline-flex items-center rounded-md bg-white dark:bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-neutral-900 dark:text-neutral-200 shadow-sm ring-1 ring-inset ring-neutral-300 dark:ring-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                                                    >
                                                        Clock Out
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {todayAttendance.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">No attendance records for today.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Action */}
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm h-fit p-6 space-y-4">
                        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-4">Quick Clock In</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Select an employee to start their shift today.</p>

                        <div className="flex flex-col gap-2 pt-2">
                            {employees.map(emp => {
                                // Find if employee already has an active shift
                                const isClockedIn = todayAttendance.some(a => a.employeeId === emp.id && !a.clockOut);

                                return (
                                    <button
                                        key={emp.id}
                                        onClick={() => handleClockIn(emp.id)}
                                        disabled={isClockedIn}
                                        className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium rounded-lg text-left disabled:opacity-50 ring-1 ring-inset ring-neutral-200 dark:ring-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <span className="text-neutral-900 dark:text-neutral-200">{emp.name}</span>
                                        {isClockedIn ? (
                                            <span className="text-xs font-semibold text-amber-500">Active</span>
                                        ) : (
                                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Clock In &rarr;</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
