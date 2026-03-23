import app from "../server/src/app.js";
import { connectToDatabase } from "../server/src/lib/db.js";

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error("API bootstrap error", error);
    return res.status(500).json({ message: "Server startup error" });
  }
}
