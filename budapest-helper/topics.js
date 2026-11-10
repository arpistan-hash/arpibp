// The knowledge base. The owner edits this file (or later a small admin page).
// updated: ISO date the owner last checked the facts. null = draft, not verified yet.
// reviewDays: after this many days the topic is shown as "may be out of date".
// Texts below are STARTER DRAFTS: check every fact before publishing.
window.TOPICS = [
  {
    id: "transport", title: "Getting around", icon: "🚋",
    updated: null, reviewDays: 90,
    summary: "Metro, trams, buses and night lines.",
    text: "Budapest has four metro lines, many trams and buses, and night services. Tickets must be validated before or when you board. Inspectors do check. You can usually buy tickets in the official transport app or at machines. Before your trip, check the current ticket and pass prices on the official transport website."
  },
  {
    id: "money", title: "Money and exchange", icon: "💶",
    updated: null, reviewDays: 60,
    summary: "Forint, cards, and avoiding bad exchange rates.",
    text: "Hungary uses the forint, not the euro. Cards and contactless work almost everywhere. Be careful with street exchange booths that advertise zero commission, since the rate itself can be poor. Compare the rate with a bank or your card app before exchanging cash."
  },
  {
    id: "baths", title: "Thermal baths", icon: "♨️",
    updated: null, reviewDays: 30,
    summary: "Which bath suits you and how to plan.",
    text: "Budapest is famous for its thermal baths. Each has its own character: some are grand and busy, some are quieter and more local. Opening hours, prices and any closures change, so check the bath's own website on the day. Bring a towel and flip-flops, or check if they can be rented."
  },
  {
    id: "safety", title: "Safety and scams", icon: "🛡️",
    updated: "2026-11-10", reviewDays: 180,
    summary: "Emergency numbers and common tourist traps.",
    text: "The European emergency number is 112, and it works in Budapest. Agree on the price before taking a taxi, or use a ride app. Check restaurant bills for added service charges. Keep your phone and wallet secure on crowded trams and in busy areas."
  }
];
