import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { AppShell } from "./components/layout/AppShell";
import { WelcomeModal } from "./components/layout/WelcomeModal";
import { Home } from "./screens/Home";
import { MyEmpire } from "./screens/MyEmpire";
import { Marketplace } from "./screens/Marketplace";
import { BusinessDetail } from "./screens/BusinessDetail";
import { TaxOffice } from "./screens/TaxOffice";
import { Hiring } from "./screens/Hiring";
import { Finance } from "./screens/Finance";
import { RealEstate } from "./screens/RealEstate";
import { Rivals } from "./screens/Rivals";
import { Login } from "./screens/Login";
import { useUiStore } from "./state/uiStore";
import { useThemeStore, applyTheme } from "./state/themeStore";
import { useAuthStore } from "./state/authStore";

const SCREENS = {
  home: Home,
  empire: MyEmpire,
  marketplace: Marketplace,
  businessDetail: BusinessDetail,
  tax: TaxOffice,
  hiring: Hiring,
  finance: Finance,
  realestate: RealEstate,
  rivals: Rivals,
};

export default function App() {
  const screen = useUiStore((s) => s.screen);
  const setScreen = useUiStore((s) => s.setScreen);
  const theme = useThemeStore((s) => s.theme);
  const playerName = useAuthStore((s) => s.playerName);
  const ScreenComponent = SCREENS[screen] ?? Home;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // A plain conditional swap rather than wrapping this in its own
  // AnimatePresence: AppShell already runs its own AnimatePresence for
  // screen-to-screen transitions, and nesting a second one around it (for
  // the login <-> app swap) caused a runaway render loop that hung the tab.
  // Login still gets its own self-contained entrance animation.
  // MotionConfig is a plain context provider (not an AnimatePresence), so
  // wrapping everything in it to honor prefers-reduced-motion doesn't
  // reintroduce that hazard.
  if (!playerName) {
    return (
      <MotionConfig reducedMotion="user">
        <Login />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <AppShell screen={screen} onNavigate={setScreen}>
        <ScreenComponent />
      </AppShell>
      <WelcomeModal />
    </MotionConfig>
  );
}
