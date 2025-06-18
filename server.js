require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const User = require('./userModel');
const Url = require('./urlModel');
const connectDB = require('./db');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Ping route for manual ping (optional)
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

// Register route
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

// Login route
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

// Add monitored URL
app.post('/add-url', async (req, res) => {
  const { email, name, url, interval } = req.body;
  if (!email || !name || !url || !interval)
    return res.status(400).json({ message: 'Missing fields' });

  try {
    const newEntry = new Url({ email, name, url, interval });
    await newEntry.save();
    res.status(200).json({ message: 'URL saved', id: newEntry._id });
  } catch (err) {
    console.error("Add URL Error:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get URLs by user
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

// Delete URL
app.delete('/delete-url', async (req, res) => {
  const { id } = req.query;
  if (!id)
    return res.status(400).json({ message: 'ID required' });

  try {
    const result = await Url.findByIdAndDelete(id);
    if (!result)
      return res.status(404).json({ message: 'Monitor not found' });

    res.status(200).json({ message: 'Monitor deleted successfully' });
  } catch (err) {
    console.error("Delete URL Error:", err);
    res.status(500).json({ message: 'Failed to delete monitor' });
  }
});

// Periodic Monitoring and Email Alert
setInterval(async () => {
  const allUrls = await Url.find();

  allUrls.forEach(async (item) => {
    const now = Date.now();
    const intervalMs = item.interval * 60 * 1000;
    const cooldownMs = 6 * 60 * 60 * 1000; // 6 hours in ms

    // Check if it's time to ping this URL
    if (!item.lastChecked || now - item.lastChecked >= intervalMs) {
      console.log(`[${new Date().toISOString()}] Pinging ${item.url} for user ${item.email}`);

      try {
        const response = await axios.get(item.url, { timeout: 5000 });

        if (response.status >= 200 && response.status < 400) {
          console.log(`✅ ${item.url} is online`);
        } else {
          console.log(`⚠️ ${item.url} responded with status ${response.status}`);
        }

        item.lastChecked = now;
        await item.save();

      } catch (err) {
        console.log(`❌ ${item.url} is offline or unreachable: ${err.message}`);

        // Check if lastAlertSent is more than 6 hours ago
        if (!item.lastAlertSent || now - new Date(item.lastAlertSent).getTime() >= cooldownMs) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: item.email,
            subject: `Website Down: ${item.name}`,
            text: `Hello,\n\nYour monitored website "${item.name}" at ${item.url} appears to be offline.\n\n- PingIt`,
          });

          console.log(`📧 Alert email sent to ${item.email}`);
          item.lastAlertSent = now;
        } else {
          console.log(`⏳ Skipped email for ${item.url} — still in cooldown period`);
        }

        item.lastChecked = now;
        await item.save();
      }
    }
  });
}, 60 * 1000); // Check every minute

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
