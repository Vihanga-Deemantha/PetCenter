import React, { useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import DashboardSidebar from "../components/dashboard/DashboardSidebar";
import { DASHBOARD_TABS } from "../components/dashboard/dashboardTabs";
import OverviewTab from "../components/dashboard/OverviewTab";
import DonationsTab from "../components/dashboard/DonationsTab";
import BuildsTab from "../components/dashboard/BuildsTab";
import DetailsTab from "../components/dashboard/DetailsTab";
import SettingsTab from "../components/dashboard/SettingsTab";

const VALID_TABS = new Set(DASHBOARD_TABS.map((t) => t.key));

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedTab = searchParams.get("tab");
  const activeTab = VALID_TABS.has(requestedTab) ? requestedTab : "overview";
  const usesRefinedLayout = activeTab === "overview";

  useEffect(() => {
    const label = DASHBOARD_TABS.find((t) => t.key === activeTab)?.label || "Dashboard";
    document.title = `${label} | PetCenter`;
  }, [activeTab]);

  const setTab = (tab) => {
    if (tab === "orders" || tab === "favorites") {
      navigate(`/${tab}`);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set("tab", tab);
    setSearchParams(next);
  };

  // Orders and saved items now have their own full account pages. Preserve old
  // bookmarks and links without maintaining two competing versions of them.
  if (requestedTab === "orders" || requestedTab === "favorites") {
    return <Navigate to={`/${requestedTab}`} replace />;
  }

  return (
    <div className="min-h-screen bg-light flex flex-col md:flex-row">
      <DashboardSidebar activeTab={activeTab} onSelect={setTab} />
      <main className="flex-1 min-w-0">
        <div className={`${usesRefinedLayout ? "max-w-6xl" : "max-w-5xl"} mx-auto px-5 sm:px-8 lg:px-10 py-8 sm:py-10 lg:py-12`}>
          {activeTab === "overview" && <OverviewTab onNavigateTab={setTab} />}
          {activeTab === "donations" && <DonationsTab />}
          {activeTab === "builds" && <BuildsTab />}
          {activeTab === "details" && <DetailsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </div>
      </main>
    </div>
  );
}
