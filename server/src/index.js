import app from "./app.js";
import { closeMongo, connectToDatabase } from "./lib/db.js";

const PORT = process.env.PORT || 5000;
let isShuttingDown = false;

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
  try {
    await connectToDatabase();
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
