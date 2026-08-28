// Flavor "market news" shown on the home feed before the player owns any
// businesses of their own. Later stages will mix in real events generated
// by the player's businesses, employees, stocks, etc.
export const FLAVOR_NEWS = [
  { icon: "trending-up", title: "Stock markets rally on strong tech earnings", tone: "good" },
  { icon: "landmark", title: "Central Bank holds interest rates steady", tone: "neutral" },
  { icon: "trending-down", title: "Retail sector shares dip amid weak footfall", tone: "bad" },
  { icon: "truck", title: "Docklands Mega Storage reports record deliveries", tone: "neutral" },
  { icon: "newspaper", title: "Analysts predict busy quarter for hospitality", tone: "good" },
  { icon: "package", title: "Supply chain costs ease across the city", tone: "good" },
  { icon: "trending-up", title: "Property prices climb in central London", tone: "good" },
  { icon: "briefcase", title: "New business licenses hit a 3-year high", tone: "neutral" },
  { icon: "trending-down", title: "Energy prices tick up ahead of winter", tone: "bad" },
  { icon: "landmark", title: "Government announces new small business grants", tone: "good" },
];

export function pickFlavorNews(count = 1) {
  const pool = [...FLAVOR_NEWS];
  const picked = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}
