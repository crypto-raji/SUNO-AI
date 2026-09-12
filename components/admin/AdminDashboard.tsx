"use client";

import { useState, useCallback } from "react";
import AdminHeader, { type AdminTab } from "@/components/admin/AdminHeader";
import OverviewTab from "@/components/admin/tabs/OverviewTab";
import UsersTab from "@/components/admin/tabs/UsersTab";
import ContentTab from "@/components/admin/tabs/ContentTab";
import DiagnosticsTab from "@/components/admin/tabs/DiagnosticsTab";
import AuditLogsTab from "@/components/admin/tabs/AuditLogsTab";

interface StatsData {
  metrics: {
    totalUsers: number;
    activeUsers7d: number;
    activeUsers30d: number;
    totalSessions: number;
    totalMessages: number;
    totalDocuments: number;
    totalAudioFiles: number;
    totalTokens: number;
    totalCharacters: number;
    totalApiCalls: number;
  };
  usageByService: Record<string, { characters: number; tokens: number; calls: number }>;
  modeDistribution: Record<string, number>;
  documentStatuses: Record<string, number>;
  audioStatuses: Record<string, number>;
  topReferrers: Array<{ id: string; name: string; count: number }>;
  appSettings: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
  };
}

interface AdminDashboardProps {
  initialStats: StatsData;
  keys: Record<string, { configured: boolean; hint: string; provider: "groq" | "assemblyai" | null }>;
  currentAdminId: string;
}

export default function AdminDashboard({
  initialStats,
  keys,
  currentAdminId,
}: AdminDashboardProps) {
  const [currentTab, setCurrentTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<StatsData>(initialStats);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (res.ok) {
        setStats(json);
      }
    } catch {
      // ignore
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10 space-y-8">
      {/* Header with quick stats & tab navigation */}
      <AdminHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        maintenanceMode={stats.appSettings.maintenanceMode}
        onRefresh={refreshStats}
        isRefreshing={isRefreshing}
      />

      {/* Main Tab Content Panes */}
      <div className="transition-all duration-200">
        {currentTab === "overview" && <OverviewTab data={stats} />}

        {currentTab === "users" && <UsersTab currentAdminId={currentAdminId} />}

        {currentTab === "content" && <ContentTab />}

        {currentTab === "diagnostics" && (
          <DiagnosticsTab
            keys={keys}
            maintenanceMode={stats.appSettings.maintenanceMode}
            maintenanceMessage={stats.appSettings.maintenanceMessage}
          />
        )}

        {currentTab === "audit" && <AuditLogsTab />}
      </div>
    </div>
  );
}
