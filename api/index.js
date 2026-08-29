const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

app.get('/', (req, res) => {
  res.send('ONEBR Universal Stream Extractor Online 🚀');
});

// محرك القواعد والتوجيه الذكي
app.get('/api/resolve', async (req, res) => {
  const { tmdb, type = 'movie', s = '1', e = '1', imdb = '', lang = '', isAnime = '0' } = req.query;

  if (!tmdb) {
    return res.status(400).json({ success: false, message: 'Missing TMDB ID' });
  }

  const isMovie = (type === 'movie');
  const imdbId = imdb || tmdb;

  // تعريف قائمة السيرفرات العالمية
  const serverProviders = {
    vidlink: { name: "VidLink Pro (سريع وبدون إعلانات)", url: isMovie ? `https://vidlink.pro/movie/${tmdb}` : `https://vidlink.pro/tv/${tmdb}/${s}/${e}` },
    embedsu: { name: "Embed.su (جودة عالية)", url: isMovie ? `https://embed.su/embed/movie/${tmdb}` : `https://embed.su/embed/tv/${tmdb}/${s}/${e}` },
    autoembed: { name: "AutoEmbed Pro", url: isMovie ? `https://player.autoembed.cc/embed/movie/${tmdb}` : `https://player.autoembed.cc/embed/tv/${tmdb}/${s}/${e}` },
    multiembed: { name: "MultiEmbed (شامل تركي وآسيوي)", url: isMovie ? `https://multiembed.mov/?video_id=${tmdb}&tmdb=1` : `https://multiembed.mov/?video_id=${tmdb}&tmdb=1&s=${s}&e=${e}` },
    vidsrc_anime: { name: "VidSrc Anime (مخصص للأنمي)", url: isMovie ? `https://vidsrc.icu/embed/anime/${tmdb}` : `https://vidsrc.icu/embed/anime/${tmdb}/${s}/${e}` },
    smashy: { name: "SmashyStream", url: isMovie ? `https://embed.smashystream.com/playere.php?tmdb=${tmdb}` : `https://embed.smashystream.com/playere.php?tmdb=${tmdb}&season=${s}&episode=${e}` },
    twoembed: { name: "2Embed VIP", url: isMovie ? `https://www.2embed.cc/embed/${tmdb}` : `https://www.2embed.cc/embedtv/${tmdb}&s=${s}&e=${e}` },
    vidsrcto: { name: "VidSrc.to", url: isMovie ? `https://vidsrc.to/embed/movie/${tmdb}` : `https://vidsrc.to/embed/tv/${tmdb}/${s}/${e}` },
    vidsrcme: { name: "VidSrc.me", url: isMovie ? `https://vidsrc.me/embed/movie?tmdb=${tmdb}` : `https://vidsrc.me/embed/tv?tmdb=${tmdb}&season=${s}&episode=${e}` },
    nontongo: { name: "NontonGo", url: isMovie ? `https://www.nontongo.win/embed/movie/${tmdb}` : `https://www.nontongo.win/embed/tv/${tmdb}/${s}/${e}` },
    moviesapi: { name: "MoviesAPI Club", url: isMovie ? `https://moviesapi.club/movie/${tmdb}` : `https://moviesapi.club/tv/${tmdb}-${s}-${e}` },
    rive: { name: "Rive Stream", url: isMovie ? `https://rive.stream/embed/movie/${tmdb}` : `https://rive.stream/embed/tv/${tmdb}/${s}/${e}` },
    warezcdn: { name: "WarezCDN Player", url: isMovie ? `https://embed.warezcdn.net/filme/${imdbId}` : `https://embed.warezcdn.net/serie/${imdbId}/${s}/${e}` }
  };

  let sortedServers = [];

  // 1. تطبيق قواعد الأنمي 🎌
  if (isAnime === '1' || lang === 'ja') {
    sortedServers = [
      serverProviders.vidsrc_anime,
      serverProviders.autoembed,
      serverProviders.multiembed,
      serverProviders.embedsu,
      serverProviders.vidlink,
      serverProviders.smashy,
      serverProviders.twoembed,
      serverProviders.nontongo,
      serverProviders.vidsrcto,
      serverProviders.vidsrcme,
      serverProviders.moviesapi,
      serverProviders.rive,
      serverProviders.warezcdn
    ];
  }
  // 2. تطبيق قواعد الدراما التركية والآسيوية 🇹🇷 🇰🇷
  else if (lang === 'tr' || lang === 'ko' || lang === 'zh') {
    sortedServers = [
      serverProviders.multiembed,
      serverProviders.autoembed,
      serverProviders.smashy,
      serverProviders.embedsu,
      serverProviders.vidlink,
      serverProviders.twoembed,
      serverProviders.nontongo,
      serverProviders.vidsrcto,
      serverProviders.vidsrcme,
      serverProviders.moviesapi,
      serverProviders.rive,
      serverProviders.warezcdn,
      serverProviders.vidsrc_anime
    ];
  }
  // 3. الترتيب الافتراضي للأفلام والمسلسلات العالمية وهوليوود 🎬
  else {
    sortedServers = [
      serverProviders.vidlink,
      serverProviders.embedsu,
      serverProviders.autoembed,
      serverProviders.multiembed,
      serverProviders.smashy,
      serverProviders.twoembed,
      serverProviders.nontongo,
      serverProviders.vidsrcto,
      serverProviders.vidsrcme,
      serverProviders.moviesapi,
      serverProviders.rive,
      serverProviders.warezcdn,
      serverProviders.vidsrc_anime
    ];
  }

  // ترقيم السيرفرات وإرسالها للواجهة
  const formattedServers = sortedServers.map((srv, index) => ({
    id: index + 1,
    name: `سيرفر ${index + 1} (${srv.name})`,
    url: srv.url
  }));

  return res.json({
    success: true,
    workingServerUrl: formattedServers[0].url,
    serverName: formattedServers[0].name,
    totalServers: formattedServers.length,
    servers: formattedServers
  });
});

// مسار البروكسي
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
