const express = require('express');
const cors = require('cors');
const fs = require('fs');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection failed", err));

app.post('/register', (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync('./users.json'));

  const existingUser = users.find(u => u.email === email);
  if (existingUser) return res.json({ success: false, message: 'User already exists' });

  users.push({ email, password, monitors: [] });
  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const users = JSON.parse(fs.readFileSync('./users.json'));

  const existingUser = users.find(u => u.email === email && u.password === password);
  if (!existingUser) return res.json({ success: false, message: 'Invalid credentials' });

  res.json({ success: true });
});

app.get('/ping', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.json({ success: false });

  try {
    const response = await axios.get(url);
    res.json({ success: true, status: response.status });
  } catch (error) {
    res.json({ success: false, error: error.code || 'Request failed' });
  }
});

app.post('/addMonitor', (req, res) => {
  const { email, monitor } = req.body;
  const users = JSON.parse(fs.readFileSync('./users.json'));

  const user = users.find(u => u.email === email);
  if (!user) return res.json({ success: false });

  monitor.id = Date.now(); // Give a unique ID
  user.monitors.push(monitor);

  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.get('/getMonitors', (req, res) => {
  const { email } = req.query;
  const users = JSON.parse(fs.readFileSync('./users.json'));

  const user = users.find(u => u.email === email);
  if (!user) return res.json({ success: false });

  res.json({ success: true, monitors: user.monitors });
});

// ✅ UPDATED deleteMonitor Route
app.delete('/deleteMonitor', async (req, res) => {
  const { id } = req.query;
  const users = JSON.parse(fs.readFileSync('./users.json'));

  let userFound = false;
  users.forEach(user => {
    const initialLength = user.monitors.length;
    user.monitors = user.monitors.filter(m => String(m.id) !== String(id));
    if (initialLength !== user.monitors.length) userFound = true;
  });

  if (!userFound) {
    return res.json({ success: false });
  }

  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
  res.json({ success: true });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
