import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { MobileTabBar } from "./MobileTabBar";
import { MoreSheet } from "./MoreSheet";
import { SettingsModal } from "./SettingsModal";
import { ChangelogModal } from "./ChangelogModal";

const screenTransition = { type: "spring", stiffness: 480, damping: 34, mass: 0.5 };

// Settings/Changelog live here (not inside Sidebar) so both the desktop
// Sidebar and the mobile MoreSheet can open them without duplicating state
// or mounting two copies of each modal.
export function AppShell({ screen, onNavigate, children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const openSettings = () => setSettingsOpen(true);
  const openChangelog = () => {
    setSettingsOpen(false);
    setChangelogOpen(true);
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-surface-sunken">
      {/* Visually hidden until focused — first Tab stop for keyboard users. */}
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[60] -translate-y-16 rounded-xl bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white transition-transform focus-visible:translate-y-0"
      >
        Skip to content
      </a>

      <Sidebar current={screen} onNavigate={onNavigate} onOpenSettings={openSettings} />

      <main
        id="main-content"
        tabIndex={-1}
        className="app-scroll min-w-0 flex-1 overflow-y-auto pb-20 md:pb-0"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screen}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={screenTransition}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <MobileTabBar current={screen} onNavigate={onNavigate} onOpenMore={() => setMoreOpen(true)} />
      <MoreSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        current={screen}
        onNavigate={onNavigate}
        onOpenSettings={openSettings}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onOpenChangelog={openChangelog} />
      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </div>
  );
}
