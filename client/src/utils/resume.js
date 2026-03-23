import { getTemplateById } from "../data/templates.js";

const createClientKey = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const uniqueStrings = (items = []) => {
  if (!Array.isArray(items)) return [];
  return [...new Set(items.map((item) => cleanString(item)).filter(Boolean))];
};

const hasContent = (value) => {
  if (Array.isArray(value)) return value.some(hasContent);
  if (value && typeof value === "object") {
    return Object.entries(value).some(([key, item]) => key !== "clientKey" && hasContent(item));
  }

  return Boolean(cleanString(value));
};

export const parseSkillsText = (value = "") =>
  uniqueStrings(
    value
      .split(/,|\n/)
      .map((item) => item.replace(/^[-*]\s*/, ""))
      .filter(Boolean)
  );

export const createEmptyExperienceItem = () => ({
  company: "",
  role: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  achievements: [],
  clientKey: createClientKey(),
});

export const createEmptyEducationItem = () => ({
  school: "",
  degree: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  clientKey: createClientKey(),
});

export const createEmptyProjectItem = () => ({
  name: "",
  link: "",
  description: "",
  clientKey: createClientKey(),
});

const withClientKeys = (items = [], factory) => {
  const source = Array.isArray(items) && items.length ? items : [factory()];
  return source.map((item) => ({
    ...factory(),
    ...item,
    clientKey: item.clientKey || item._id || createClientKey(),
  }));
};

export const normalizeResume = (resume = {}, user = null) => {
  const template = getTemplateById(resume.templateId);

  return {
    _id: resume._id,
    title: resume.title || `${user?.name || "New"} Resume`,
    slug: resume.slug || "",
    templateId: template.id,
    accentColor: resume.accentColor || template.accent,
    isPublic: resume.isPublic ?? true,
    ownerName: resume.ownerName || user?.name || "",
    headline: resume.headline || "",
    summary: resume.summary || "",
    contact: {
      email: resume.contact?.email || user?.email || "",
      phone: resume.contact?.phone || "",
      location: resume.contact?.location || "",
      website: resume.contact?.website || "",
      linkedin: resume.contact?.linkedin || "",
    },
    skills: uniqueStrings(resume.skills),
    experience: withClientKeys(resume.experience, createEmptyExperienceItem),
    education: withClientKeys(resume.education, createEmptyEducationItem),
    projects: withClientKeys(resume.projects, createEmptyProjectItem),
    profileImage: {
      url: resume.profileImage?.url || "",
      backgroundRemovedUrl: resume.profileImage?.backgroundRemovedUrl || "",
    },
    rawText: resume.rawText || "",
    content: resume.content || "",
    createdAt: resume.createdAt || "",
    updatedAt: resume.updatedAt || "",
  };
};

const stripExperience = (items = []) =>
  items
    .map((item) => ({
      _id: item._id,
      company: cleanString(item.company),
      role: cleanString(item.role),
      location: cleanString(item.location),
      startDate: cleanString(item.startDate),
      endDate: cleanString(item.endDate),
      description: cleanString(item.description),
      achievements: uniqueStrings(item.achievements),
    }))
    .filter(hasContent);

const stripEducation = (items = []) =>
  items
    .map((item) => ({
      _id: item._id,
      school: cleanString(item.school),
      degree: cleanString(item.degree),
      location: cleanString(item.location),
      startDate: cleanString(item.startDate),
      endDate: cleanString(item.endDate),
      description: cleanString(item.description),
    }))
    .filter(hasContent);

const stripProjects = (items = []) =>
  items
    .map((item) => ({
      _id: item._id,
      name: cleanString(item.name),
      link: cleanString(item.link),
      description: cleanString(item.description),
    }))
    .filter(hasContent);

export const prepareResumePayload = (resume) => ({
  title: cleanString(resume.title) || "Untitled Resume",
  slug: cleanString(resume.slug),
  templateId: cleanString(resume.templateId) || "aurora",
  accentColor: cleanString(resume.accentColor) || getTemplateById(resume.templateId).accent,
  isPublic: Boolean(resume.isPublic),
  ownerName: cleanString(resume.ownerName),
  headline: cleanString(resume.headline),
  summary: cleanString(resume.summary),
  contact: {
    email: cleanString(resume.contact?.email),
    phone: cleanString(resume.contact?.phone),
    location: cleanString(resume.contact?.location),
    website: cleanString(resume.contact?.website),
    linkedin: cleanString(resume.contact?.linkedin),
  },
  skills: uniqueStrings(resume.skills),
  experience: stripExperience(resume.experience),
  education: stripEducation(resume.education),
  projects: stripProjects(resume.projects),
  profileImage: {
    url: cleanString(resume.profileImage?.url),
    backgroundRemovedUrl: cleanString(resume.profileImage?.backgroundRemovedUrl),
  },
  rawText: cleanString(resume.rawText),
  content: cleanString(resume.content),
});

export const formatSkillsText = (skills = []) => uniqueStrings(skills).join(", ");
