import { AppShell } from "./components/layout/AppShell";
import { Home } from "./screens/Home";
import { useUiStore } from "./state/uiStore";

const SCREENS = {
  home: Home,
};

export default function App() {
  const screen = useUiStore((s) => s.screen);
  const setScreen = useUiStore((s) => s.setScreen);
  const ScreenComponent = SCREENS[screen] ?? Home;

  return (
    <AppShell screen={screen} onNavigate={setScreen}>
      <ScreenComponent />
    </AppShell>
  );
}
