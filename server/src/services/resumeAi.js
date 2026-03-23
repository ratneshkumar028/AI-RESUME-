const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "been",
  "build",
  "built",
  "candidate",
  "company",
  "create",
  "created",
  "current",
  "daily",
  "deliver",
  "delivered",
  "design",
  "details",
  "experience",
  "focused",
  "including",
  "manage",
  "managed",
  "professional",
  "project",
  "projects",
  "resume",
  "responsible",
  "seeking",
  "strong",
  "team",
  "using",
  "years",
]);

const cleanString = (value) => (typeof value === "string" ? value.trim() : "");

const uniqueList = (items) => [...new Set(items.map((item) => cleanString(item)).filter(Boolean))];

const extractKeywords = (text = "", max = 12) => {
  const matches = text.match(/[A-Za-z][A-Za-z+#./-]{2,}/g) || [];

  return uniqueList(matches)
    .filter((token) => !STOP_WORDS.has(token.toLowerCase()))
    .slice(0, max);
};

const buildResumeContext = (resume) => ({
  ownerName: resume.ownerName,
  title: resume.title,
  headline: resume.headline,
  summary: resume.summary,
  contact: resume.contact,
  skills: resume.skills,
  experience: (resume.experience || []).map((item) => ({
    company: item.company,
    role: item.role,
    location: item.location,
    startDate: item.startDate,
    endDate: item.endDate,
    description: item.description,
    achievements: item.achievements,
  })),
  education: resume.education,
  projects: resume.projects,
  rawText: resume.rawText,
});

const extractTextResponse = (payload) =>
  payload?.candidates?.[0]?.content?.parts
    ?.map((part) => cleanString(part?.text))
    .filter(Boolean)
    .join("\n")
    .trim() || "";

const extractJsonBlock = (text = "") => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
};

const parseSkills = (text = "") =>
  uniqueList(
    text
      .split(/,|\n|[|]/)
      .map((item) => item.replace(/^[-*]\s*/, ""))
      .filter((item) => item.length <= 35)
  ).slice(0, 14);

const buildFallbackHeadline = (resume, suggestedSkills) => {
  if (cleanString(resume.headline)) return resume.headline;

  const primaryRole = resume.experience?.find((item) => item.role)?.role || resume.title?.replace(/\s+resume$/i, "");
  const topSkills = suggestedSkills.slice(0, 3).join(" | ");

  return [primaryRole, topSkills].filter(Boolean).join(" | ") || "Modern Resume";
};

const buildFallbackSummary = (resume, suggestedSkills, jobDescription) => {
  if (cleanString(resume.summary)) return resume.summary;

  const role = resume.experience?.find((item) => item.role)?.role || resume.title?.replace(/\s+resume$/i, "") || "professional";
  const skillLine = suggestedSkills.slice(0, 4).join(", ");
  const jdKeywords = extractKeywords(jobDescription, 4).join(", ");

  return [
    `Results-driven ${role} with hands-on experience delivering clear, user-focused work.`,
    skillLine ? `Core strengths include ${skillLine}.` : "",
    jdKeywords ? `Prepared to align that experience with roles emphasizing ${jdKeywords}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const buildFallbackSkills = (resume, jobDescription) => {
  const seededSkills = uniqueList([...(resume.skills || []), ...extractKeywords(jobDescription, 12)]);

  if (seededSkills.length) return seededSkills.slice(0, 14);

  return extractKeywords(resume.rawText || resume.content || "", 10);
};

const buildFallbackResult = (resume, mode, jobDescription) => {
  const skills = buildFallbackSkills(resume, jobDescription);
  const headline = buildFallbackHeadline(resume, skills);
  const summary = buildFallbackSummary(resume, skills, jobDescription);

  if (mode === "summary") {
    return { updates: { summary }, usedAi: false, provider: "local" };
  }

  if (mode === "skills") {
    return { updates: { skills }, usedAi: false, provider: "local" };
  }

  if (mode === "headline") {
    return { updates: { headline }, usedAi: false, provider: "local" };
  }

  return {
    updates: { headline, summary, skills },
    usedAi: false,
    provider: "local",
  };
};

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey || typeof fetch !== "function") {
    throw new Error("Gemini is not configured");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorBody}`);
  }

  const payload = await response.json();
  return extractTextResponse(payload);
};

const buildPrompt = (resume, mode, jobDescription) => {
  const context = JSON.stringify(buildResumeContext(resume), null, 2);
  const targetRole = cleanString(jobDescription);

  if (mode === "summary") {
    return `You are an expert resume writer.
Rewrite the candidate summary to be concise, ATS-friendly, and factual.
Do not invent employers, dates, or metrics.
Keep it to 3 or 4 sentences max.
Return only the rewritten summary text.

Target job description:
${targetRole || "Not provided"}

Candidate data:
${context}`;
  }

  if (mode === "skills") {
    return `You are an expert resume writer.
Select 8 to 14 resume skills grounded in the candidate data and target role.
Prefer concrete tools, technologies, and transferable capabilities.
Do not invent skills unsupported by the candidate data or target job description.
Return only a comma-separated list.

Target job description:
${targetRole || "Not provided"}

Candidate data:
${context}`;
  }

  if (mode === "headline") {
    return `You are an expert resume writer.
Write a crisp resume headline of at most 12 words.
Keep it factual and aligned to the candidate data.
Return only the headline text.

Target job description:
${targetRole || "Not provided"}

Candidate data:
${context}`;
  }

  return `You are an expert resume writer.
Optimize this resume for clarity and impact while staying strictly factual.
Do not invent companies, dates, degrees, responsibilities, or metrics.
Return valid JSON only with this exact shape:
{
  "headline": "string",
  "summary": "string",
  "skills": ["skill one", "skill two"]
}

The summary should be 3 or 4 sentences max.
The skills array should contain 8 to 14 concise items.

Target job description:
${targetRole || "Not provided"}

Candidate data:
${context}`;
};

export const optimizeResumeData = async ({ resume, mode = "full", jobDescription = "" }) => {
  const normalizedMode = ["summary", "skills", "headline", "full"].includes(mode) ? mode : "full";

  try {
    const prompt = buildPrompt(resume, normalizedMode, jobDescription);
    const aiText = await callGemini(prompt);

    if (!aiText) {
      throw new Error("Empty Gemini response");
    }

    if (normalizedMode === "summary") {
      return {
        updates: { summary: aiText.trim() },
        usedAi: true,
        provider: "gemini",
      };
    }

    if (normalizedMode === "skills") {
      const skills = parseSkills(aiText);
      if (!skills.length) throw new Error("No skills returned");

      return {
        updates: { skills },
        usedAi: true,
        provider: "gemini",
      };
    }

    if (normalizedMode === "headline") {
      return {
        updates: { headline: aiText.trim() },
        usedAi: true,
        provider: "gemini",
      };
    }

    const parsed = extractJsonBlock(aiText);
    if (!parsed) {
      throw new Error("Could not parse JSON response");
    }

    return {
      updates: {
        headline: cleanString(parsed.headline),
        summary: cleanString(parsed.summary),
        skills: uniqueList(Array.isArray(parsed.skills) ? parsed.skills : []).slice(0, 14),
      },
      usedAi: true,
      provider: "gemini",
    };
  } catch (error) {
    console.error("Resume optimization fallback", error.message);
    return buildFallbackResult(resume, normalizedMode, jobDescription);
  }
};
