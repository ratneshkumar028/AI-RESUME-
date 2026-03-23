import express from "express";
import Resume from "../models/Resume.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  buildImageKitBackgroundRemovedUrl,
  createResumeDefaults,
  createSlug,
  extractResumeFromText,
  sanitizeResumePayload,
} from "../utils/resume.js";
import { optimizeResumeData } from "../services/resumeAi.js";

const router = express.Router();

const isDuplicateKeyError = (error) => error?.code === 11000;

const handlePersistenceError = (error, res) => {
  if (isDuplicateKeyError(error)) {
    return res.status(409).json({ message: "That public link is already in use. Try another slug." });
  }

  console.error("Resume route error", error);
  return res.status(500).json({ message: "Server error" });
};

// GET /api/resumes/public/:slug - public resume preview
router.get("/public/:slug", async (req, res) => {
  try {
    const resume = await Resume.findOne({
      slug: req.params.slug,
      isPublic: true,
    }).select("-user");

    if (!resume) {
      return res.status(404).json({ message: "Public resume not found" });
    }

    return res.json(resume);
  } catch (error) {
    return handlePersistenceError(error, res);
  }
});

// All remaining routes are protected
router.use(authMiddleware);

// GET /api/resumes - list current user's resumes
router.get("/", async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(resumes);
  } catch (err) {
    handlePersistenceError(err, res);
  }
});

// GET /api/resumes/:id - fetch one resume
router.get("/:id", async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    return res.json(resume);
  } catch (error) {
    return handlePersistenceError(error, res);
  }
});

// POST /api/resumes - create a resume
router.post("/", async (req, res) => {
  try {
    const defaults = createResumeDefaults({
      title: req.body.title || "Untitled Resume",
      templateId: req.body.templateId,
      name: req.body.ownerName,
      email: req.body.contact?.email || req.user.email || "",
    });

    const payload = sanitizeResumePayload({
      ...defaults,
      ...req.body,
      slug: req.body.slug || defaults.slug || createSlug(req.body.title),
    });

    const resume = await Resume.create({
      user: req.user.id,
      ...payload,
      slug: payload.slug || defaults.slug,
    });

    res.status(201).json(resume);
  } catch (err) {
    handlePersistenceError(err, res);
  }
});

// PUT /api/resumes/:id - update resume
router.put("/:id", async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const payload = sanitizeResumePayload(req.body);
    resume.set(payload);

    if ("slug" in payload && !payload.slug) {
      resume.slug = createSlug(payload.title || resume.title);
    }

    if (!resume.slug) {
      resume.slug = createSlug(resume.title);
    }

    await resume.save();
    res.json(resume);
  } catch (err) {
    handlePersistenceError(err, res);
  }
});

// POST /api/resumes/:id/import - import pasted or uploaded resume text
router.post("/:id/import", async (req, res) => {
  const resumeText = typeof req.body.resumeText === "string" ? req.body.resumeText : "";
  if (!resumeText.trim()) {
    return res.status(400).json({ message: "Resume text is required for import" });
  }

  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const extracted = extractResumeFromText(resumeText, resume.toObject());
    resume.set(sanitizeResumePayload(extracted));
    resume.aiMeta = {
      ...(resume.aiMeta?.toObject?.() || resume.aiMeta || {}),
      lastImportedAt: new Date(),
      provider: "local",
    };

    await resume.save();

    return res.json({
      resume,
      message: "Resume text imported. Review the extracted fields before sharing.",
    });
  } catch (error) {
    return handlePersistenceError(error, res);
  }
});

// POST /api/resumes/:id/optimize - improve resume using Gemini or local fallback
router.post("/:id/optimize", async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const result = await optimizeResumeData({
      resume: resume.toObject(),
      mode: req.body.mode,
      jobDescription: req.body.jobDescription || "",
    });

    resume.set(sanitizeResumePayload(result.updates));
    resume.aiMeta = {
      ...(resume.aiMeta?.toObject?.() || resume.aiMeta || {}),
      lastOptimizedAt: new Date(),
      provider: result.provider,
    };

    await resume.save();

    return res.json({
      resume,
      usedAi: result.usedAi,
      provider: result.provider,
      message: result.usedAi
        ? "Resume optimized with Gemini."
        : "Gemini is not configured, so a local optimization fallback was applied.",
    });
  } catch (error) {
    return handlePersistenceError(error, res);
  }
});

// POST /api/resumes/:id/profile-image - persist an image and optionally derive a background-free ImageKit URL
router.post("/:id/profile-image", async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    const previousUrl = resume.profileImage?.url || "";
    const imageUrl = typeof req.body.imageUrl === "string" ? req.body.imageUrl.trim() : resume.profileImage?.url || "";
    const removeBackground = Boolean(req.body.removeBackground);

    resume.profileImage = {
      url: imageUrl,
      backgroundRemovedUrl:
        removeBackground && imageUrl
          ? buildImageKitBackgroundRemovedUrl(imageUrl, process.env.IMAGEKIT_URL_ENDPOINT)
          : resume.profileImage?.backgroundRemovedUrl || "",
    };

    if (!removeBackground && imageUrl !== previousUrl) {
      resume.profileImage.backgroundRemovedUrl = "";
    }

    await resume.save();

    const processedUrl = resume.profileImage.backgroundRemovedUrl;
    const message = removeBackground
      ? processedUrl
        ? "Background removal URL generated with ImageKit."
        : "Image saved. To generate a background-free variant automatically, use an ImageKit-hosted image URL and set IMAGEKIT_URL_ENDPOINT."
      : "Profile image saved.";

    return res.json({ resume, message });
  } catch (error) {
    return handlePersistenceError(error, res);
  }
});

// DELETE /api/resumes/:id - remove resume
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Resume.findOneAndDelete({ _id: id, user: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Resume not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    handlePersistenceError(err, res);
  }
});

export default router;
