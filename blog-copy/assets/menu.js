// The menu guests can order from on the table page (table.html and the "At my table" section).
// Bar and lounge menu: drinks plus a page of food. An empty list is simply not shown.
// While both lists are empty, the menu stays hidden and guests just write what they want.
//
// Shape:
//   food:   [ { category: "Starters", items: [ { name: "Lángos", desc: "garlic, sour cream, cheese", price: "2 900 Ft", options: [...] } ] } ]
//   drinks: same shape.
//   options (optional, per item): [ { label: "How would you like it?", choices: ["Neat", "On the rocks"] } ]
//   Use options: "spirit" for the usual spirit choices (single/double, neat/rocks/mixer) defined below.
window.ARPI_SPIRIT_OPTIONS = [
  { label: "Size", choices: ["Single", "Double"] },
  { label: "How would you like it?", choices: ["Neat", "On the rocks", "With a mixer"] },
  { label: "Mixer", when: "With a mixer", choices: ["Coke", "Coke Zero", "Tonic", "Soda", "Ginger ale", "Sprite", "Orange juice", "Cranberry juice"] }
];

window.ARPI_MENU = {
  food: [
    { category: "Snacks", items: [
      { name: "Lángos" },
      { name: "Nuts" },
      { name: "Olives" }
    ] },
    { category: "Salads", items: [
      { name: "Caesar salad", options: [{ label: "Chicken?", choices: ["With chicken", "Without chicken"] }] },
      { name: "Beet salad" }
    ] },
    { category: "Mains", items: [
      { name: "Burger" }
    ] }
  ],
  drinks: []
};
