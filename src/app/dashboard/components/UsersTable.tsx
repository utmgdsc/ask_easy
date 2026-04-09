"use client";

import React, { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Search } from "lucide-react";

interface User {
  id: string;
  utorid: string;
  email: string;
  name: string;
  role: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const fetchRef = useRef(0);

  useEffect(() => {
    const id = ++fetchRef.current;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter) params.set("role", roleFilter);
    fetch(`/api/admin/users?${params}`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (id === fetchRef.current) setUsers(data.users ?? []);
      })
      .catch(() => {
        if (id === fetchRef.current) setUsers([]);
      });
  }, [search, roleFilter]);

  const handleDelete = async (userId: string, name: string) => {
    if (!window.confirm(`Delete user "${name}" and ALL their data? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      fetchRef.current++;
      setUsers((prev) => (prev ? prev.filter((u) => u.id !== userId) : prev));
    } else alert("Failed to delete user.");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search by name or UTORid…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="TA">TA</option>
          <option value="PROFESSOR">Professor</option>
        </select>
      </div>

      <div className="rounded-md border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50 text-stone-500">
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">UTORid</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users === null ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{user.utorid}</td>
                  <td className="px-4 py-3 text-stone-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(user.id, user.name)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    PROFESSOR: "bg-purple-100 text-purple-700",
    TA: "bg-blue-100 text-blue-700",
    STUDENT: "bg-stone-100 text-stone-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[role] ?? styles.STUDENT}`}
    >
      {role}
    </span>
  );
}
