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
    // Deliberately NOT height-locked (no h-[100dvh]) with an inner
    // overflow-y-auto scroller -- that nested-scroll-inside-a-dvh-parent
    // pattern is what caused the reported iOS bug: Safari recalculates
    // 100dvh as its toolbar hides/shows *during* a scroll gesture, which
    // resizes this outer container mid-scroll and snaps the inner
    // scroller's position back. Letting the document/body itself scroll
    // (the sidebar goes sticky, the tab bar stays fixed) sidesteps the
    // whole class of bug -- there's only one scroll container, and it's
    // the one iOS already knows how to resize correctly.
    <div className="flex w-full bg-surface-sunken">
      {/* Visually hidden until focused — first Tab stop for keyboard users. */}
      <a
        href="#main-content"
        className="fixed left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-[60] -translate-y-20 rounded-xl bg-brand-500 px-4 py-2 text-[13px] font-semibold text-white transition-transform focus-visible:translate-y-0"
      >
        Skip to content
      </a>

      <Sidebar current={screen} onNavigate={onNavigate} onOpenSettings={openSettings} />

      <main
        id="main-content"
        tabIndex={-1}
        className="min-w-0 flex-1 pt-[env(safe-area-inset-top)] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
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
