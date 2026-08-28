import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { Home } from "./screens/Home";
import { useUiStore } from "./state/uiStore";
import { useThemeStore, applyTheme } from "./state/themeStore";

const SCREENS = {
  home: Home,
};

export default function App() {
  const screen = useUiStore((s) => s.screen);
  const setScreen = useUiStore((s) => s.setScreen);
  const theme = useThemeStore((s) => s.theme);
  const ScreenComponent = SCREENS[screen] ?? Home;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <AppShell screen={screen} onNavigate={setScreen}>
      <ScreenComponent />
    </AppShell>
  );
}
