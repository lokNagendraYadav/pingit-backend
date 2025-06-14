const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ email, password, monitoredUrls: [] });
    await newUser.save();

    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", email: user.email });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Save URLs
router.post("/save-urls", async (req, res) => {
  const { email, urls } = req.body;
  if (!email || !Array.isArray(urls)) {
    return res.status(400).json({ message: "Invalid data" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.monitoredUrls = urls;
    await user.save();

    res.status(200).json({ message: "URLs saved successfully" });
  } catch (err) {
    console.error("Save URLs error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get URLs
router.get("/get-urls", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: "Email required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ urls: user.monitoredUrls || [] });
  } catch (err) {
    console.error("Get URLs error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
