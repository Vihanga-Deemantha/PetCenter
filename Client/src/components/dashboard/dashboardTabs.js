import { LayoutGrid, Package, Heart, Gift, Boxes, User, Settings } from "lucide-react";

export const DASHBOARD_TABS = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "orders", label: "Orders", icon: Package },
  { key: "favorites", label: "Saved pets & products", icon: Heart },
  { key: "donations", label: "Donations", icon: Gift },
  { key: "builds", label: "Habitat builds", icon: Boxes },
  { key: "details", label: "Your details", icon: User },
  { key: "settings", label: "Settings", icon: Settings },
];
