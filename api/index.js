const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 📋 مصفوفة قوالب السيرفرات
const serverTemplates = [
  { name: 'VidSrc PRO', movie: (id) => `https://vidsrc.to/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
  { name: 'VidSrc ME', movie: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`, tv: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&sea=${s}&epi=${e}` },
  { name: 'VidSrc CC', movie: (id) => `https://vidsrc.cc/v2/embed/movie/${id}`, tv: (id, s, e) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` },
  { name: 'AutoEmbed CC', movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`, tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` },
  { name: 'EmbedSu', movie: (id) => `https://embed.su/embed/movie/${id}`, tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}` },
  { name: 'SmashyStream', movie: (id) => `https://embed.smashystream.com/playere.php?tmdb=${id}`, tv: (id, s, e) => `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}` },
  { name: 'VidLink', movie: (id) => `https://vidlink.pro/movie/${id}`, tv: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}` }
  // يمكننا إضافة بقية السيرفرات هنا بنفس النمط 🚀
];

// 📡 مسار جلب قائمة السيرفرات
app.get('/api/servers', (req, res) => {
  const { type, id, s, e } = req.query;

  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف id مطلوب ❌' });
  }

  // 🔄 إنشاء الروابط بناءً على النوع (فيلم أو مسلسل)
  const servers = serverTemplates.map((server) => ({
    name: server.name,
    url: type === 'tv' ? server.tv(id, s, e) : server.movie(id)
  }));

  return res.json({
    success: true,
    count: servers.length,
    servers: servers
  });
});

module.exports = app;
