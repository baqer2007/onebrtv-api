const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// 🔓 دالة فك التشفير الأساسية (عكس النص ثم فك Base64)
function decodeStreamUrl(encodedText) {
  try {
    const reversed = encodedText.split('').reverse().join('');
    return Buffer.from(reversed, 'base64').toString('utf-8');
  } catch (e) {
    return null;
  }
}

// 📡 مسار جلب البث المباشر للأفلام والمسلسلات
app.get('/api/stream', async (req, res) => {
  const { type, id, s, e } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing TMDB ID' });
  }

  // 1. التحقق من نوع العمل وتحديد الرابط المطلوب
  let targetUrl = '';
  if (type === 'tv') {
    if (!s || !e) {
      return res.status(400).json({ success: false, message: 'Missing season (s) or episode (e)' });
    }
    targetUrl = `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
  } else {
    targetUrl = `https://vidsrc.to/embed/movie/${id}`;
  }

  try {
    // نص تجريبي لمحاكاة فك التشفير واستخراج البث الصافي
    const mockEncodedData = "=02bj5SZulmcv52Y";
    const realUrl = decodeStreamUrl(mockEncodedData);

    if (realUrl) {
      // 🛡️ تغليف الرابط الصافي داخل البروكسي
      const proxiedUrl = `/api/proxy?url=${encodeURIComponent('https://' + realUrl)}&referer=https://vidsrc.to/`;

      return res.json({
        success: true,
        type: type || 'movie',
        id: id,
        embedUrl: targetUrl,
        streamUrl: proxiedUrl
      });
    }

    return res.status(500).json({ success: false, message: 'Decryption failed' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 🛡️ مسار البروكسي لتخطي قيود CORS وحماية البث
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  const customReferer = req.query.referer || 'https://vidsrc.to/';

  if (!targetUrl) {
    return res.status(400).send('Missing URL');
  }

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
