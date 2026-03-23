import crypto from "crypto";

const KNOWN_HEADINGS = [
  "summary",
  "profile",
  "experience",
  "work experience",
  "employment",
  "education",
  "projects",
  "skills",
  "technical skills",
  "certifications",
  "awards",
];

const DEFAULT_TEMPLATE = "aurora";
const DEFAULT_ACCENT = "#0f766e";

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const cleanStringList = (items = []) => {
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

const sanitizeTextBlock = (value) =>
  cleanString(value)
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");

export const createSlug = (value = "resume") => {
  const base = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  return `${base || "resume"}-${crypto.randomBytes(3).toString("hex")}`;
};

export const normalizeSlug = (value = "") =>
  cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

export const createExperienceItem = () => ({
  company: "",
  role: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  achievements: [],
});

export const createEducationItem = () => ({
  school: "",
  degree: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
});

export const createProjectItem = () => ({
  name: "",
  link: "",
  description: "",
});

export const createResumeDefaults = ({ name = "", email = "", title = "Untitled Resume", templateId = DEFAULT_TEMPLATE } = {}) => ({
  title,
  slug: createSlug(title),
  templateId,
  accentColor: DEFAULT_ACCENT,
  isPublic: true,
  headline: "",
  summary: "",
  contact: {
    email,
    phone: "",
    location: "",
    website: "",
    linkedin: "",
  },
  skills: [],
  experience: [createExperienceItem()],
  education: [createEducationItem()],
  projects: [createProjectItem()],
  profileImage: {
    url: "",
    backgroundRemovedUrl: "",
  },
  rawText: "",
  content: "",
  ownerName: cleanString(name),
});

const sanitizeExperience = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      _id: item?._id,
      company: cleanString(item?.company),
      role: cleanString(item?.role),
      location: cleanString(item?.location),
      startDate: cleanString(item?.startDate),
      endDate: cleanString(item?.endDate),
      description: sanitizeTextBlock(item?.description),
      achievements: cleanStringList(item?.achievements),
    }))
    .filter(hasContent);

const sanitizeEducation = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      _id: item?._id,
      school: cleanString(item?.school),
      degree: cleanString(item?.degree),
      location: cleanString(item?.location),
      startDate: cleanString(item?.startDate),
      endDate: cleanString(item?.endDate),
      description: sanitizeTextBlock(item?.description),
    }))
    .filter(hasContent);

const sanitizeProjects = (items) =>
  (Array.isArray(items) ? items : [])
    .map((item) => ({
      _id: item?._id,
      name: cleanString(item?.name),
      link: cleanString(item?.link),
      description: sanitizeTextBlock(item?.description),
    }))
    .filter(hasContent);

export const sanitizeResumePayload = (payload = {}) => {
  const sanitized = {};

  if ("title" in payload) sanitized.title = cleanString(payload.title) || "Untitled Resume";
  if ("slug" in payload) sanitized.slug = normalizeSlug(payload.slug);
  if ("templateId" in payload) sanitized.templateId = cleanString(payload.templateId) || DEFAULT_TEMPLATE;
  if ("accentColor" in payload) sanitized.accentColor = cleanString(payload.accentColor) || DEFAULT_ACCENT;
  if ("isPublic" in payload) sanitized.isPublic = Boolean(payload.isPublic);
  if ("headline" in payload) sanitized.headline = cleanString(payload.headline);
  if ("summary" in payload) sanitized.summary = sanitizeTextBlock(payload.summary);
  if ("rawText" in payload) sanitized.rawText = sanitizeTextBlock(payload.rawText);
  if ("content" in payload) sanitized.content = sanitizeTextBlock(payload.content);
  if ("ownerName" in payload) sanitized.ownerName = cleanString(payload.ownerName);

  if ("contact" in payload) {
    sanitized.contact = {
      email: cleanString(payload.contact?.email),
      phone: cleanString(payload.contact?.phone),
      location: cleanString(payload.contact?.location),
      website: cleanString(payload.contact?.website),
      linkedin: cleanString(payload.contact?.linkedin),
    };
  }

  if ("skills" in payload) sanitized.skills = cleanStringList(payload.skills);
  if ("experience" in payload) sanitized.experience = sanitizeExperience(payload.experience);
  if ("education" in payload) sanitized.education = sanitizeEducation(payload.education);
  if ("projects" in payload) sanitized.projects = sanitizeProjects(payload.projects);

  if ("profileImage" in payload) {
    sanitized.profileImage = {
      url: cleanString(payload.profileImage?.url),
      backgroundRemovedUrl: cleanString(payload.profileImage?.backgroundRemovedUrl),
    };
  }

  return sanitized;
};

const pickLikelySummary = (lines) => {
  const summaryLines = [];

  for (const line of lines.slice(1, 8)) {
    const normalized = line.toLowerCase();
    if (!line) continue;
    if (KNOWN_HEADINGS.includes(normalized)) break;
    if (/@/.test(line) || /linkedin|github|http/i.test(line)) continue;
    if (line.length < 15) continue;

    summaryLines.push(line);
    if (summaryLines.join(" ").length > 280) break;
  }

  return summaryLines.join(" ").trim();
};

const getSectionLines = (lines, headings) => {
  const headingSet = new Set(headings.map((item) => item.toLowerCase()));
  const startIndex = lines.findIndex((line) => headingSet.has(line.toLowerCase()));

  if (startIndex === -1) return [];

  const sectionLines = [];
  for (const line of lines.slice(startIndex + 1)) {
    if (KNOWN_HEADINGS.includes(line.toLowerCase())) break;
    if (line) sectionLines.push(line);
  }

  return sectionLines;
};

const extractSkillsFromSection = (sectionLines) => {
  const rawText = sectionLines.join(" | ");
  const separators = /[,|/]|(?:\s+-\s+)|(?:\s{2,})/g;

  return cleanStringList(
    rawText
      .split(separators)
      .map((item) => item.replace(/^[*-]\s*/, ""))
      .filter((item) => item.length <= 30)
  ).slice(0, 16);
};

const mergeSkills = (...lists) => cleanStringList(lists.flat()).slice(0, 16);

export const extractResumeFromText = (rawText = "", currentResume = {}) => {
  const text = sanitizeTextBlock(rawText);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return {
      rawText: "",
    };
  }

  const firstLine = lines[0];
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/);
  const websiteMatch = text.match(/https?:\/\/[^\s]+/i);
  const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[^\s]+/i);
  const skillsSection = getSectionLines(lines, ["skills", "technical skills"]);
  const extractedSkills = extractSkillsFromSection(skillsSection);
  const summary = pickLikelySummary(lines);

  return {
    title: currentResume.title || (firstLine.length <= 80 ? `${firstLine} Resume` : "Imported Resume"),
    ownerName: currentResume.ownerName || (firstLine.length <= 60 ? firstLine : currentResume.ownerName || ""),
    headline: currentResume.headline || lines.find((line, index) => index > 0 && line.length > 10 && line.length < 90) || "",
    summary: summary || currentResume.summary || "",
    rawText: text,
    contact: {
      email: emailMatch?.[0] || currentResume.contact?.email || "",
      phone: phoneMatch?.[0] || currentResume.contact?.phone || "",
      location: currentResume.contact?.location || "",
      website: websiteMatch?.[0] || currentResume.contact?.website || "",
      linkedin: linkedinMatch?.[0] || currentResume.contact?.linkedin || "",
    },
    skills: mergeSkills(currentResume.skills || [], extractedSkills),
    content: text,
  };
};

export const buildImageKitBackgroundRemovedUrl = (imageUrl = "", endpoint = "") => {
  const cleanedUrl = cleanString(imageUrl);
  if (!cleanedUrl) return "";

  const isImageKitUrl = cleanedUrl.includes("imagekit.io") || (endpoint && cleanedUrl.startsWith(endpoint.replace(/\/$/, "")));
  if (!isImageKitUrl) return "";

  try {
    const url = new URL(cleanedUrl);
    url.searchParams.set("tr", "e-bgremove");
    return url.toString();
  } catch (error) {
    return "";
  }
};

export const DEFAULT_TEMPLATE_ID = DEFAULT_TEMPLATE;
export const DEFAULT_ACCENT_COLOR = DEFAULT_ACCENT;
