import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";
import { CHANGELOG } from "../../data/changelog";

export function ChangelogModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Update Log" className="max-w-md">
      <div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto pr-1">
        {CHANGELOG.map((entry) => (
          <div key={entry.version} className="flex flex-col gap-1.5 border-b border-border pb-4 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="brand">{entry.version}</Badge>
                <p className="text-[13.5px] font-bold text-ink">{entry.title}</p>
              </div>
              <span className="shrink-0 text-[11.5px] font-medium text-ink-faint">{entry.date}</span>
            </div>
            <ul className="flex flex-col gap-1 pl-0.5">
              {entry.notes.map((note, i) => (
                <li key={i} className="text-[12.5px] leading-snug text-ink-soft">
                  · {note}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
