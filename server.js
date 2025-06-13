const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
