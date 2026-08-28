"use client";
import React, { useEffect, useState, useCallback } from "react";
import { getDB } from "@/lib/db/rxdb-setup";
import { runFullSync } from "@/lib/db/sync";

export default function SyncManager() {
    const [status, setStatus] = useState<"Online" | "Offline" | "Syncing">("Online");

    const triggerSync = useCallback(async () => {
        setStatus("Syncing");
        try {
            const db = await getDB();
            if (db) {
                await runFullSync(db);
                setStatus("Online");
            } else {
                setStatus("Offline");
            }
        } catch (e) {
            console.error("Sync Trigger Failed: ", e);
            setStatus("Offline");
        }
    }, []);

    const resetLocalDB = async () => {
        const confirmed = window.confirm("DANGER: This will permanently wipe all local database records including unsynced offline sales. Are you sure?");
        if (!confirmed) return;

        try {
            const db = await getDB();
            if (db) {
                await db.remove(); // Natively wipes RxDB SQLite/IndexedDB structures
                window.location.reload();
            }
        } catch (e) {
            console.error("Failed to reset DB:", e);
            alert("Failed to reset database. Check console.");
        }
    };

    useEffect(() => {
        // App Load Sync
        triggerSync();

        // Window Event Sync
        const handleOnline = () => triggerSync();
        const handleOffline = () => setStatus("Offline");
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Heartbeat Monitor (15s)
        const interval = setInterval(async () => {
            try {
                const res = await fetch("http://localhost:4000/health", { cache: "no-store", method: "GET" });
                if (res.ok) {
                    setStatus((prev) => {
                        if (prev === "Offline") {
                            triggerSync(); // Run sync as we have regained connection
                            return "Syncing";
                        }
                        return prev; // Stay as is if already Online or Syncing
                    });
                } else {
                    setStatus("Offline");
                }
            } catch (e) {
                setStatus("Offline");
            }
        }, 15000);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            clearInterval(interval);
        };
    }, [triggerSync]);

    return (
        <div className={`w-full flex items-center justify-between px-6 py-2 shrink-0 transition-colors border-b ${status === "Offline"
                ? "bg-red-600 border-red-700 text-white"
                : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800"
            }`}>
            {/* Left side: Status & offline messaging */}
            <div className="flex items-center gap-3">
                {status === "Syncing" && (
                    <svg className="w-5 h-5 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {status === "Offline" && (
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                )}
                <span className={`text-sm font-bold tracking-tight ${status === "Offline" ? "text-white" : "text-neutral-700 dark:text-neutral-300"}`}>
                    {status === "Offline"
                        ? "⚠️ OFFLINE MODE - Unsynced changes will be saved locally"
                        : "Retail OS Sync Engine"
                    }
                </span>
            </div>

            {/* Right side: Action Buttons */}
            <div className="flex items-center gap-3">
                <button
                    onClick={triggerSync}
                    disabled={status === "Syncing"}
                    className={`flex items-center gap-2 rounded px-3 py-1.5 text-xs font-bold transition-colors ${status === "Offline"
                            ? "bg-white/20 hover:bg-white/30 text-white"
                            : "bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200"
                        }`}
                >
                    <svg className={`w-4 h-4 ${status === "Syncing" ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {status === "Syncing" ? "SYNCING..." : "MANUAL SYNC"}
                </button>

                <button
                    onClick={resetLocalDB}
                    className="flex items-center gap-2 rounded px-3 py-1.5 text-xs font-bold transition-colors bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    DANGER: RESET DB
                </button>
            </div>
        </div>
    );
}
