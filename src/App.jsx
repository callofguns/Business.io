import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { useUiStore } from "./state/uiStore";
import { useThemeStore, applyTheme } from "./state/themeStore";
import { useAuthStore } from "./state/authStore";

const SCREENS = {
  home: Home,
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
  if (!playerName) {
    return <Login />;
  }

  return (
    <AppShell screen={screen} onNavigate={setScreen}>
      <ScreenComponent />
    </AppShell>
  );
}
