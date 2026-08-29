const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

// مسار الفحص والاستخراج الذكي
app.get('/api/resolve', async (req, res) => {
  const { tmdb, type = 'movie', s = '1', e = '1' } = req.query;

  if (!tmdb) {
    return res.status(400).json({ success: false, message: 'Missing TMDB ID' });
  }

  const isMovie = (type === 'movie');

  const extractors = [
    // 1. استخراج مباشر من VidLink API
    async () => {
      const url = isMovie 
        ? `https://vidlink.pro/api/b/movie/${tmdb}` 
        : `https://vidlink.pro/api/b/tv/${tmdb}/${s}/${e}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Referer': 'https://vidlink.pro/',
          'Origin': 'https://vidlink.pro'
        },
        timeout: 3500
      });

      if (response.data?.stream?.playlist) {
        return {
          directStreamUrl: response.data.stream.playlist,
          referer: 'https://vidlink.pro/',
          serverName: 'VidLink Direct HLS'
        };
      }
      return null;
    },

    // 2. استخراج مباشر من AutoEmbed
    async () => {
      const url = isMovie
        ? `https://player.autoembed.cc/embed/movie/${tmdb}`
        : `https://player.autoembed.cc/embed/tv/${tmdb}/${s}/${e}`;

      const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 3000
      });

      const match = response.data.match(/file:\s*["']([^"']+\.m3u8[^"']*)["']/i);
      if (match && match[1]) {
        return {
          directStreamUrl: match[1],
          referer: 'https://player.autoembed.cc/',
          serverName: 'AutoEmbed Raw M3U8'
        };
      }
      if (response.data.length > 800 && !response.data.includes("not found")) {
        return { workingServerUrl: url, serverName: 'AutoEmbed Pro' };
      }
      return null;
    },

    // 3. فحص VidSrc المستقر
    async () => {
      const url = isMovie
        ? `https://vidsrc.cc/v2/embed/movie/${tmdb}`
        : `https://vidsrc.cc/v2/embed/tv/${tmdb}/${s}/${e}`;

      const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 3000
      });

      if (response.status === 200 && response.data.length > 600) {
        return { workingServerUrl: url, serverName: 'VidSrc Fast' };
      }
      return null;
    },

    // 4. MultiEmbed الشامل للأعمال القديمة
    async () => {
      const url = isMovie
        ? `https://multiembed.mov/?video_id=${tmdb}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdb}&tmdb=1&s=${s}&e=${e}`;

      const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 3000
      });

      if (!response.data.includes("There are no sources yet") && response.data.length > 600) {
        return { workingServerUrl: url, serverName: 'MultiEmbed Global' };
      }
      return null;
    }
  ];

  for (const extract of extractors) {
    try {
      const result = await extract();
      if (result) {
        return res.json({ success: true, ...result });
      }
    } catch (err) {}
  }

  return res.json({
    success: true,
    workingServerUrl: isMovie 
      ? `https://vidsrc.cc/v2/embed/movie/${tmdb}` 
      : `https://vidsrc.cc/v2/embed/tv/${tmdb}/${s}/${e}`,
    serverName: 'VidSrc Backup'
  });
});

// مسار البروكسي الداخلي
app.get('/api/proxy', async (req, res) => {
  const targetUrl = req.query.url;
  const customReferer = req.query.referer || 'https://vidlink.pro/';

  if (!targetUrl) return res.status(400).send('Missing target URL');

  try {
    const response = await axios.get(targetUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': USER_AGENT,
        'Referer': customReferer,
        'Origin': new URL(customReferer).origin
      },
      timeout: 8000
    });

    const contentType = response.headers['content-type'] || '';

    if (contentType.includes('application/vnd.apple.mpegurl') || targetUrl.includes('.m3u8')) {
      let content = response.data.toString('utf8');
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      const host = `${req.protocol}://${req.get('host')}`;

      content = content.replace(/^(?!#)(?!\s*$)(.+)$/gm, (match) => {
        const fullUrl = match.startsWith('http') ? match : baseUrl + match.trim();
        return `${host}/api/proxy?url=${encodeURIComponent(fullUrl)}&referer=${encodeURIComponent(customReferer)}`;
      });

      content = content.replace(/URI="([^"]+)"/g, (match, keyUrl) => {
        const fullKeyUrl = keyUrl.startsWith('http') ? keyUrl : baseUrl + keyUrl;
        return `URI="${host}/api/proxy?url=${encodeURIComponent(fullKeyUrl)}&referer=${encodeURIComponent(customReferer)}"`;
      });

      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      return res.send(content);
    }

    res.setHeader('Content-Type', contentType);
    return res.send(response.data);
  } catch (error) {
    return res.status(500).send('Proxy Stream Error');
  }
});

// مسار الترجمة التلقائية
app.get('/api/subtitles', (req, res) => {
  const { tmdb, type = 'movie', s = '1', e = '1' } = req.query;
  const subs = [{
    lang: "Arabic", code: "ar", label: "العربية",
    url: `https://sub.wyzie.ru/subtitles/${tmdb}/${type === 'tv' ? `${s}-${e}` : '0'}?lang=ar`
  }];
  res.json(subs);
});

app.get('/', (req, res) => {
  res.send('ONEBR Universal Stream Extractor Online 🚀');
});

module.exports = app;
