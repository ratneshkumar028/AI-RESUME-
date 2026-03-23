export const resumeTemplates = [
  {
    id: "aurora",
    name: "Aurora",
    accent: "#0f766e",
    mood: "Bold gradient",
    description: "A vibrant profile-first layout for modern product, design, and tech roles.",
  },
  {
    id: "ledger",
    name: "Ledger",
    accent: "#b45309",
    mood: "Editorial",
    description: "A refined, structured look that feels polished for operations, business, and consulting.",
  },
  {
    id: "zenith",
    name: "Zenith",
    accent: "#1d4ed8",
    mood: "Minimal edge",
    description: "A crisp, airy treatment with calm spacing for a clean personal brand.",
  },
];

export const getTemplateById = (templateId) =>
  resumeTemplates.find((template) => template.id === templateId) || resumeTemplates[0];
