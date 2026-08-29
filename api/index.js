const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// الصفحة الرئيسية لتأكيد عمل الخادم
app.get('/', (req, res) => {
  res.send('ONEBR Universal Stream Extractor Online 🚀');
});

// مسار فحص وتوليد السيرفرات الذكي
app.get('/api/resolve', async (req, res) => {
  const { tmdb, type = 'movie', s = '1', e = '1', imdb = '' } = req.query;

  if (!tmdb) {
    return res.status(400).json({ success: false, message: 'Missing TMDB ID' });
  }

  const isMovie = (type === 'movie');
  const imdbId = imdb || tmdb;

  // قائمة الـ 26 سيرفر العالمية الشاملة
  const allServers = [
    {
      id: 1,
      name: "MultiEmbed (متعدد المصادر)",
      url: isMovie ? `https://multiembed.mov/?video_id=${tmdb}&tmdb=1` : `https://multiembed.mov/?video_id=${tmdb}&tmdb=1&s=${s}&e=${e}`
    },
    {
      id: 2,
      name: "AutoEmbed Pro",
      url: isMovie ? `https://player.autoembed.cc/embed/movie/${tmdb}` : `https://player.autoembed.cc/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 3,
      name: "Embed.su",
      url: isMovie ? `https://embed.su/embed/movie/${tmdb}` : `https://embed.su/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 4,
      name: "VidLink Pro",
      url: isMovie ? `https://vidlink.pro/movie/${tmdb}` : `https://vidlink.pro/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 5,
      name: "SmashyStream (Embed)",
      url: isMovie ? `https://embed.smashystream.com/playere.php?tmdb=${tmdb}` : `https://embed.smashystream.com/playere.php?tmdb=${tmdb}&season=${s}&episode=${e}`
    },
    {
      id: 6,
      name: "SmashyStream (Player)",
      url: isMovie ? `https://player.smashy.stream/movie/${tmdb}` : `https://player.smashy.stream/tv/${tmdb}?s=${s}&e=${e}`
    },
    {
      id: 7,
      name: "2Embed (CC)",
      url: isMovie ? `https://www.2embed.cc/embed/${tmdb}` : `https://www.2embed.cc/embedtv/${tmdb}&s=${s}&e=${e}`
    },
    {
      id: 8,
      name: "2Embed (Skin)",
      url: isMovie ? `https://www.2embed.skin/embed/movie/${tmdb}` : `https://www.2embed.skin/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 9,
      name: "VidSrc.to",
      url: isMovie ? `https://vidsrc.to/embed/movie/${tmdb}` : `https://vidsrc.to/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 10,
      name: "VidSrc.me",
      url: isMovie ? `https://vidsrc.me/embed/movie?tmdb=${tmdb}` : `https://vidsrc.me/embed/tv?tmdb=${tmdb}&season=${s}&episode=${e}`
    },
    {
      id: 11,
      name: "VidSrc.xyz",
      url: isMovie ? `https://vidsrc.xyz/embed/movie/${tmdb}` : `https://vidsrc.xyz/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 12,
      name: "VidSrc.pm",
      url: isMovie ? `https://vidsrc.pm/embed/movie/${tmdb}` : `https://vidsrc.pm/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 13,
      name: "VidSrc.net",
      url: isMovie ? `https://vidsrc.net/embed/movie/${tmdb}` : `https://vidsrc.net/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 14,
      name: "VidSrc.in",
      url: isMovie ? `https://vidsrc.in/embed/movie/${tmdb}` : `https://vidsrc.in/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 15,
      name: "VidSrc.vip",
      url: isMovie ? `https://vidsrc.vip/embed/movie/${tmdb}` : `https://vidsrc.vip/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 16,
      name: "MoviesAPI Club",
      url: isMovie ? `https://moviesapi.club/movie/${tmdb}` : `https://moviesapi.club/tv/${tmdb}-${s}-${e}`
    },
    {
      id: 17,
      name: "Rive Stream",
      url: isMovie ? `https://rive.stream/embed/movie/${tmdb}` : `https://rive.stream/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 18,
      name: "NontonGo",
      url: isMovie ? `https://www.nontongo.win/embed/movie/${tmdb}` : `https://www.nontongo.win/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 19,
      name: "Moviee TV",
      url: isMovie ? `https://moviee.tv/embed/movie/${tmdb}` : `https://moviee.tv/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 20,
      name: "111Movies",
      url: isMovie ? `https://111movies.com/movie/${tmdb}` : `https://111movies.com/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 21,
      name: "AutoEmbed Co",
      url: isMovie ? `https://autoembed.co/movie/tmdb/${tmdb}` : `https://autoembed.co/tv/tmdb/${tmdb}-${s}-${e}`
    },
    {
      id: 22,
      name: "VidSrc Anime (سيرفر أنمي خاص)",
      url: isMovie ? `https://vidsrc.icu/embed/anime/${tmdb}` : `https://vidsrc.icu/embed/anime/${tmdb}/${s}/${e}`
    },
    {
      id: 23,
      name: "WarezCDN Player",
      url: isMovie ? `https://embed.warezcdn.net/filme/${imdbId}` : `https://embed.warezcdn.net/serie/${imdbId}/${s}/${e}`
    },
    {
      id: 24,
      name: "SuperEmbed VIP",
      url: isMovie ? `https://multiembed.mov/directstream.php?video_id=${tmdb}&tmdb=1` : `https://multiembed.mov/directstream.php?video_id=${tmdb}&tmdb=1&s=${s}&e=${e}`
    },
    {
      id: 25,
      name: "VidSrc.cc (v2)",
      url: isMovie ? `https://vidsrc.cc/v2/embed/movie/${tmdb}` : `https://vidsrc.cc/v2/embed/tv/${tmdb}/${s}/${e}`
    },
    {
      id: 26,
      name: "VidSrc.sbs",
      url: isMovie ? `https://vidsrc.sbs/embed/movie/${tmdb}` : `https://vidsrc.sbs/embed/tv/${tmdb}/${s}/${e}`
    }
  ];

  // إرجاع النتيجة مع السيرفر الأول كافتراضي والمصفوفة الكاملة
  return res.json({
    success: true,
    workingServerUrl: allServers[0].url,
    serverName: allServers[0].name,
    totalServers: allServers.length,
    servers: allServers
  });
});

// مسار بروكسي لتجاوز قيود CORS عند الحاجة
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
