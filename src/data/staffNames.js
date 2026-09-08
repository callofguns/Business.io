// Stage 14: every new hire gets a randomly-paired name from this pool
// (16 x 16 = 256 combinations) instead of being a bare headcount number.
// Pure random pairing, no dedup guard against currently-employed names --
// headcounts stay small enough that a repeat is rare and harmless flavor.
const FIRST_NAMES = [
  "Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Mia", "Lucas",
  "Sophia", "Mason", "Isla", "Owen", "Grace", "Leo", "Nora", "Elijah",
];

const LAST_NAMES = [
  "Bennett", "Hughes", "Martin", "Young", "Carter", "Reed", "Foster", "Coleman",
  "Bishop", "Sutton", "Palmer", "Grant", "Wells", "Hart", "Dawson", "Fletcher",
];

export function randomStaffName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}
