"use client";
import { useSearchParams } from "next/navigation";
import Room from "./room/page";
import type { Role } from "@/utils/types";

export default function Home() {
  const params = useSearchParams();

  const roleParam = params.get("role");
  const role: Role =
    roleParam === "professor"
      ? "PROFESSOR"
      : roleParam === "ta"
        ? "TA"
        : "STUDENT";

  return (
    <div className="flex h-screen w-full flex-col bg-background font-sans">
      <main className="flex-1 overflow-hidden">
        <Room
          sessionId={params.get("sessionId") ?? "placeholder-session"}
          userId={params.get("userId") ?? "placeholder-user"}
          role={role}
        />
      </main>
    </div>
  );
}
