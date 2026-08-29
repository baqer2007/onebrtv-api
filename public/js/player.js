document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const video = document.getElementById('videoPlayer');

  // 1. قراءة المعاملات من رابط الصفحة
  const urlParams = new URLSearchParams(window.location.search);
  const streamUrl = urlParams.get('url');
  const subtitleUrl = urlParams.get('sub');

  if (!streamUrl) {
    statusEl.innerText = 'خطأ: يرجى تزويد رابط الفيديو عبر المعامل ?url= ❌';
    return;
  }

  // 2. إضافة ملف الترجمة إن وُجد
  if (subtitleUrl) {
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Arabic';
    track.srclang = 'ar';
    track.src = subtitleUrl;
    track.default = true;
    video.appendChild(track);
  }

  // 3. تمرير البث عبر البروكسي المحلي لتفادي مشاكل الحظر و CORS
  const finalStreamUrl = `/api/proxy?url=${encodeURIComponent(streamUrl)}`;

  // 4. تهيئة وتشغيل الفيديو عبر Hls.js
  if (Hls.isSupported() && (streamUrl.includes('.m3u8') || streamUrl.includes('m3u'))) {
    const hls = new Hls();
    hls.loadSource(finalStreamUrl);
    hls.attachMedia(video);
    
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      statusEl.style.display = 'none';
      video.play().catch(() => {
        console.log('انقر على الفيديو لبدء التشغيل');
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        statusEl.innerText = 'تعذر تحميل البث، قد يكون الرابط منتهياً ⚠️';
      }
    });
  } else {
    // للمتصفحات التي تدعم التشغيل المباشر أو لملفات MP4
    video.src = finalStreamUrl;
    video.addEventListener('loadedmetadata', () => {
      statusEl.style.display = 'none';
      video.play();
    });
  }
});
