const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// 📡 مسار جلب البث للأفلام والمسلسلات
app.get('/api/stream', async (req, res) => {
  const { type, id, s, e } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing TMDB ID' });
  }

  let embedUrl = '';
  if (type === 'tv') {
    if (!s || !e) {
      return res.status(400).json({ success: false, message: 'Missing season (s) or episode (e)' });
    }
    embedUrl = `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
  } else {
    embedUrl = `https://vidsrc.to/embed/movie/${id}`;
  }

  return res.json({
    success: true,
    type: type || 'movie',
    id,
    embedUrl
  });
});

// 🛡️ مسار البروكسي لتخطي قيود CORS
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  const customReferer = req.query.referer || 'https://vidlink.pro/';

  if (!targetUrl) return res.status(400).send('Missing URL');

  try {
    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': customReferer
      },
      timeout: 10000
    });

    res.setHeader('Content-Type', response.headers['content-type'] || 'text/plain');
    return res.send(response.data);
  } catch (err) {
    return res.status(500).send('Proxy Error');
  }
});

module.exports = app;
