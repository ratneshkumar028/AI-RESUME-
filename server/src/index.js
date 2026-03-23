import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import resumeRoutes from "./routes/resumes.js";

dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);

app.get("/", (req, res) => {
  res.send("AI Resume Builder API is running");
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
let isShuttingDown = false;

const closeMongo = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

const shutdown = async (server, signal, onClosed = () => process.exit(0)) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    try {
      await closeMongo();
    } finally {
      onClosed();
    }
  });
};

const startServer = async () => {
  if (!MONGO_URI) {
    console.error("Missing MONGO_URI. Add it to server/.env before starting the API.");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    server.on("error", async (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Stop the existing server or change PORT in server/.env.`);
      } else {
        console.error("Server startup error:", error.message);
      }

      await closeMongo();
      process.exit(1);
    });

    ["SIGINT", "SIGTERM"].forEach((signal) => {
      process.on(signal, () => {
        void shutdown(server, signal);
      });
    });

    process.once("SIGUSR2", () => {
      void shutdown(server, "SIGUSR2", () => {
        if (process.platform === "win32") {
          process.exit(0);
          return;
        }

        process.kill(process.pid, "SIGUSR2");
      });
    });
  } catch (err) {
    console.error("Mongo connection error:", err.message);
    process.exit(1);
  }
};

void startServer();
