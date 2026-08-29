const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// 🏠 مسار فحص حالة الخادم
app.get('/', (req, res) => {
  res.send('ONEBR Stream API Online 🚀');
});

// 📡 مسار فحص الروابط وجلب البث
app.get('/api/stream', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: 'Missing stream URL' });
  }

  return res.json({
    success: true,
    streamUrl: url
  });
});

// 🛡️ مسار البروكسي الذكي لتشغيل m3u8 وتخطي CORS
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  const customReferer = req.query.referer || 'https://vidlink.pro/';

  if (!targetUrl) {
    return res.status(400).send('Missing target URL');
  }

  try {
    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': customReferer,
        'Origin': new URL(customReferer).origin
      },
      timeout: 10000
    });

    const contentType = response.headers['content-type'] || '';

    if (contentType.includes('application/vnd.apple.mpegurl') || targetUrl.includes('.m3u8')) {
      let content = response.data.toString('utf-8');
      const host = `${req.protocol}://${req.get('host')}`;

      content = content.replace(/(https?:\/\/[^\s]+)/g, (match) => {
        return `${host}/api/proxy?url=${encodeURIComponent(match)}&referer=${encodeURIComponent(customReferer)}`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(content);
    }

    res.setHeader('Content-Type', contentType || 'video/mp4');
    return res.send(response.data);
  } catch (err) {
    return res.status(500).send('Proxy Error');
  }
});

module.exports = app;
