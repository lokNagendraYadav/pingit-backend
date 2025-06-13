const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json()); // for parsing application/json

// Ping Route (unchanged)
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

// Users JSON path
const usersPath = path.join(__dirname, 'users.json');

// Helper to read users
function readUsers() {
  try {
    const data = fs.readFileSync(usersPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to write users
function writeUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

// Register Route
app.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  const users = readUsers();
  const existing = users.find(user => user.email === email);
  if (existing)
    return res.status(400).json({ message: 'Email already registered' });

  users.push({ email, password });
  writeUsers(users);

  res.json({ message: 'Account created successfully' });
});

// Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  const users = readUsers();
  const match = users.find(user => user.email === email && user.password === password);
  if (!match)
    return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ message: 'Login successful' });
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
