import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";

const screenTransition = { type: "spring", stiffness: 300, damping: 32, mass: 0.7 };

export function AppShell({ screen, onNavigate, children }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-sunken">
      <Sidebar current={screen} onNavigate={onNavigate} />
      <main className="app-scroll flex-1 overflow-y-auto">
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
    </div>
  );
}
