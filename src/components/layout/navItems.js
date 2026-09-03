import {
  Home,
  Building2,
  ShoppingBag,
  Users,
  LineChart,
  Landmark,
  Receipt,
  Trophy,
} from "lucide-react";

// Single source of truth for top-level navigation, consumed by both the
// desktop Sidebar and the mobile MobileTabBar/MoreSheet so the two can never
// drift out of sync. All 9 stages are live, so every item is reachable.
// `shortLabel` is only used by the mobile tab bar, which has far less room
// per item than the sidebar's full-width rows.
export const NAV_ITEMS = [
  { key: "home", label: "Home", shortLabel: "Home", icon: Home },
  { key: "empire", label: "My Empire", shortLabel: "Empire", icon: Building2 },
  { key: "marketplace", label: "Marketplace", shortLabel: "Market", icon: ShoppingBag },
  { key: "hiring", label: "Hiring", shortLabel: "Hiring", icon: Users },
  { key: "finance", label: "Finance Manager", shortLabel: "Finance", icon: LineChart },
  { key: "realestate", label: "Real Estate", shortLabel: "Estate", icon: Landmark },
  { key: "tax", label: "Tax Office", shortLabel: "Tax", icon: Receipt },
  { key: "rivals", label: "Rivals", shortLabel: "Rivals", icon: Trophy },
];

// The mobile bottom tab bar only has room for a handful of primary
// destinations; the rest live behind "More".
export const MOBILE_PRIMARY_KEYS = ["home", "empire", "marketplace", "finance"];
export const MOBILE_SECONDARY_KEYS = ["hiring", "realestate", "tax", "rivals"];
