import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resumes.js";

const currentDir = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(currentDir, "../.env") });

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get(["/", "/api"], (req, res) => {
  res.send("AI Resume Builder API is running");
});

app.use(["/api/auth", "/auth"], authRoutes);
app.use(["/api/resumes", "/resumes"], resumeRoutes);

export default app;
