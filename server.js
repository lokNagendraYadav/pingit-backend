const connectDB = require("./db");
connectDB();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const User = require('./userModel'); // MongoDB User schema
const Url = require('./urlModel');   // New model for monitored URLs

const app = express();
app.use(cors());
app.use(express.json()); // For parsing application/json

// Ping Route
app.get('/ping', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.json({ success: false });

  try {
    const response = await axios.get(url, { timeout: 5000 });
    res.json({ success: response.status >= 200 && response.status < 400 });
  } catch (error) {
    res.json({ success: false });
  }
});

// Register Route using MongoDB
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email already registered' });

    const newUser = new User({ email, password });
    await newUser.save();

    res.json({ message: 'Account created successfully' });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route using MongoDB
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const user = await User.findOne({ email, password });
    if (!user)
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({ message: 'Login successful' });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Save monitored URL (new)
app.post('/add-url', async (req, res) => {
  const { email, name, url, interval } = req.body;
  if (!email || !name || !url || !interval)
    return res.status(400).json({ message: 'Missing fields' });

  try {
    const newEntry = new Url({ email, name, url, interval });
    await newEntry.save();
    res.status(200).json({ message: 'URL saved' });
  } catch (err) {
    console.error("Add URL Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get monitored URLs by email (new)
app.get('/get-urls', async (req, res) => {
  const { email } = req.query;
  if (!email)
    return res.status(400).json({ message: 'Email required' });

  try {
    const urls = await Url.find({ email });
    res.status(200).json({ urls });
  } catch (err) {
    console.error("Get URLs Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
