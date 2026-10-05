import { LayoutGrid, Gift, Boxes, User, Settings } from "lucide-react";

export const DASHBOARD_TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "donations", label: "Donations", icon: Gift },
  { key: "builds", label: "Habitat builds", icon: Boxes },
  { key: "details", label: "Profile", icon: User },
  { key: "settings", label: "Settings", icon: Settings },
];
