import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const normalizeText = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeEmail = (value) => normalizeText(value).toLowerCase();

const findUserByEmail = (email) =>
  User.findOne({
    $expr: {
      $eq: [{ $toLower: { $trim: { input: "$email" } } }, email],
    },
  });

const buildAuthResponse = (user) => {
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email },
  };
};

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const name = normalizeText(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    res.status(201).json(buildAuthResponse(user));
  } catch (err) {
    console.error("Signup error", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const updates = {};
    const normalizedName = normalizeText(user.name);

    if (user.email !== email) {
      updates.email = email;
    }

    if (user.name !== normalizedName) {
      updates.name = normalizedName;
    }

    if (Object.keys(updates).length) {
      user.set(updates);
      await user.save();
    }

    res.json(buildAuthResponse(user));
  } catch (err) {
    console.error("Login error", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
