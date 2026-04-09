"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Users,
  BookOpen,
  Radio,
  MessageSquare,
  MessageCircle,
  UserCheck,
  RefreshCw,
} from "lucide-react";

import UsersTable from "./components/UsersTable";
import CoursesTable from "./components/CoursesTable";
import SessionsTable from "./components/SessionsTable";
import QuestionsTable from "./components/QuestionsTable";
import EnrollmentsTable from "./components/EnrollmentsTable";

interface Stats {
  users: number;
  courses: number;
  sessions: number;
  activeSessions: number;
  questions: number;
  answers: number;
  enrollments: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setStats(data);
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const statCards = [
    { label: "Total Users", value: stats?.users, icon: Users },
    { label: "Total Courses", value: stats?.courses, icon: BookOpen },
    { label: "Active Sessions", value: stats?.activeSessions, icon: Radio },
    { label: "Total Sessions", value: stats?.sessions, icon: Radio },
    { label: "Total Questions", value: stats?.questions, icon: MessageSquare },
    { label: "Total Answers", value: stats?.answers, icon: MessageCircle },
    { label: "Enrollments", value: stats?.enrollments, icon: UserCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-stone-900">Overview</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCards.map((card) => (
          <Card key={card.label} className="py-4">
            <CardHeader className="px-4 pb-0 pt-0">
              <div className="flex items-center gap-2 text-stone-500">
                <card.icon className="w-4 h-4" />
                <CardTitle className="text-xs font-medium">{card.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pt-1">
              <span className="text-2xl font-bold text-stone-900">
                {loading ? "—" : (card.value ?? 0)}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-6">
              <p className="text-stone-500 text-sm">
                Select a tab above to manage data. Use the Refresh button to reload stats and table
                data.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <UsersTable key={`users-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="courses">
          <CoursesTable key={`courses-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTable key={`sessions-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="questions">
          <QuestionsTable key={`questions-${refreshKey}`} />
        </TabsContent>

        <TabsContent value="enrollments">
          <EnrollmentsTable key={`enrollments-${refreshKey}`} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
