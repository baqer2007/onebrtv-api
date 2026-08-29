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

  // 1. تحديد رابط المزود المستهدف
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
    // 2. طلب كود صفحة التضمين الحقيقية
    const response = await axios.get(targetUrl, {
      headers: { 
        'User-Agent': USER_AGENT,
        'Referer': 'https://vidsrc.to/'
      },
      timeout: 10000
    });

    const html = response.data;

    // 3. البحث عن النص المشفر داخل كود الصفحة
    const match = html.match(/data-id="([^"]+)"/);
    const encodedData = match ? match[1] : null;

    if (encodedData) {
      // 4. فك تشفير البيانات
      const realUrl = decodeStreamUrl(encodedData);

      if (realUrl) {
        const proxiedUrl = `/api/proxy?url=${encodeURIComponent(realUrl)}&referer=https://vidsrc.to/`;

        return res.json({
          success: true,
          type: type || 'movie',
          id: id,
          streamUrl: proxiedUrl
        });
      }
    }

    // إذا لم نجد السمة المطلوبة داخل الصفحة
    return res.status(404).json({ 
      success: false, 
      message: 'لم يتم العثور على مفتاح التشفير داخل الصفحة',
      htmlSnippet: html.substring(0, 300) // جزء بسيط من الصفحة للمعاينة
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'فشل في الاتصال بالمزود',
      error: error.message 
    });
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
