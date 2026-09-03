import clsx from "clsx";

const MAX_WIDTH = {
  "3xl": "max-w-3xl",
  "5xl": "max-w-5xl",
};

// Shared page-shell wrapper for every screen. Padding shrinks on narrow
// viewports (px-10/py-10 unconditionally was the single biggest contributor
// to the mobile layout being unusable) and grows back at md, where the
// desktop sidebar returns.
export function Page({ maxWidth = "3xl", className, children }) {
  return (
    <div className={clsx("mx-auto px-4 py-6 sm:px-6 md:px-10 md:py-10", MAX_WIDTH[maxWidth], className)}>
      {children}
    </div>
  );
}
