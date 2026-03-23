import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: "" },
    role: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    description: { type: String, default: "" },
    achievements: [{ type: String }],
  },
  { _id: true }
);

const educationSchema = new mongoose.Schema(
  {
    school: { type: String, default: "" },
    degree: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    link: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: true }
);

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    templateId: { type: String, default: "aurora" },
    accentColor: { type: String, default: "#0f766e" },
    isPublic: { type: Boolean, default: true },
    ownerName: { type: String, default: "" },
    headline: { type: String, default: "" },
    summary: { type: String, default: "" },
    contact: {
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      location: { type: String, default: "" },
      website: { type: String, default: "" },
      linkedin: { type: String, default: "" },
    },
    skills: [{ type: String }],
    experience: [experienceSchema],
    education: [educationSchema],
    projects: [projectSchema],
    profileImage: {
      url: { type: String, default: "" },
      backgroundRemovedUrl: { type: String, default: "" },
    },
    rawText: { type: String, default: "" },
    content: { type: String, default: "" },
    aiMeta: {
      lastOptimizedAt: { type: Date },
      lastImportedAt: { type: Date },
      provider: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);
