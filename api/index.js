const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 📡 مسار تجهيز وتوليد رابط البث
app.get('/api/stream', (req, res) => {
  const { type, id, s, e } = req.query;

  // 1. التحقق من وجود المعرف
  if (!id) {
    return res.status(400).json({ 
      success: false, 
      message: 'يرجى إرسال المعرف id ❌' 
    });
  }

  // 2. بناء رابط التضمين بحسب النوع (فيلم أو مسلسل)
  let embedUrl = '';
  if (type === 'tv') {
    if (!s || !e) {
      return res.status(400).json({ 
        success: false, 
        message: 'يجب تحديد الموسم s والحلقة e للمسلسلات ⚠️' 
      });
    }
    embedUrl = `https://vidsrc.to/embed/tv/${id}/${s}/${e}`;
  } else {
    embedUrl = `https://vidsrc.to/embed/movie/${id}`;
  }

  // 3. إرجاع النتيجة
  return res.json({
    success: true,
    type: type || 'movie',
    id: id,
    embedUrl: embedUrl
  });
});

module.exports = app;
