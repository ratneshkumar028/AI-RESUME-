import app from "../server/src/app.js";
import { connectToDatabase } from "../server/src/lib/db.js";

const rewriteForwardedApiUrl = (requestUrl = "/api") => {
  const url = new URL(requestUrl, "http://localhost");
  const forwardedPath = url.searchParams.get("path");

  if (!forwardedPath) {
    return requestUrl;
  }

  url.searchParams.delete("path");

  const normalizedPath = forwardedPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .join("/");

  const search = url.searchParams.toString();
  return `/api/${normalizedPath}${search ? `?${search}` : ""}`;
};

export default async function handler(req, res) {
  try {
    req.url = rewriteForwardedApiUrl(req.url);
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error("API bootstrap error", error);
    return res.status(500).json({ message: "Server startup error" });
  }
}
