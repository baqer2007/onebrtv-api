document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const video = document.getElementById('videoPlayer');

  const urlParams = new URLSearchParams(window.location.search);
  const streamUrl = urlParams.get('url');
  const subtitleUrl = urlParams.get('sub');

  if (!streamUrl) {
    statusEl.innerText = 'خطأ: يرجى تزويد رابط الفيديو عبر المعامل ?url= ❌';
    return;
  }

  // إضافة ملف الترجمة إن وُجد
  if (subtitleUrl) {
    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Arabic';
    track.srclang = 'ar';
    track.src = subtitleUrl;
    track.default = true;
    video.appendChild(track);
  }

  // تشغيل البث عبر Hls.js
  if (Hls.isSupported()) {
    const hls = new Hls();
    
    // تحميل الرابط المباشر
    hls.loadSource(streamUrl);
    hls.attachMedia(video);

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      statusEl.style.display = 'none';
      video.play().catch(() => {
        console.log('انقر على الفيديو لبدء التشغيل يدويًا');
      });
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        // إذا فشل الرابط المباشر، نجرب تمريره عبر البروكسي كحل بديل
        console.warn('فشل الرابط المباشر، جاري التبديل إلى البروكسي...');
        hls.loadSource(`/api/proxy?url=${encodeURIComponent(streamUrl)}`);
      }
    });
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = streamUrl;
    video.addEventListener('loadedmetadata', () => {
      statusEl.style.display = 'none';
      video.play();
    });
  } else {
    statusEl.innerText = 'المتصفح لا يدعم هذا النوع من البث ⚠️';
  }
});
