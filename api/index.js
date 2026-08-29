const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { MOVIES, ANIME } = require('@consumet/api');

const app = express();
app.use(cors());
app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// 🏠 مسار فحص حالة الخادم
app.get('/', (req, res) => {
  res.send('Stream Extractor API Online 🚀');
});

// 📡 مسار استخراج روابط البث المباشر وملفات الترجمة
app.get('/api/stream', async (req, res) => {
  const { episodeId, mediaId } = req.query;

  if (!episodeId || !mediaId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing episodeId or mediaId' 
    });
  }

  try {
    const flixhq = new MOVIES.FlixHQ();
    const data = await flixhq.fetchEpisodeSources(episodeId, mediaId);

    return res.json({
      success: true,
      sources: data.sources || [],
      subtitles: data.subtitles || []
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch streaming sources',
      error: error.message 
    });
  }
});

// 🛡️ مسار البروكسي لتمرير ملفات m3u8 و ts بدون حظر
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
    
    // إذا كان الملف m3u8 نقوم بإعادة كتابة روابط المقاطع لتمر عبر البروكسي
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
