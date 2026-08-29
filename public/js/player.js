document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const video = document.getElementById('videoPlayer');

  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'movie';
  const id = urlParams.get('id');
  const s = urlParams.get('s');
  const e = urlParams.get('e');
  const directUrl = urlParams.get('url');

  // 1. إذا كان رابطاً مباشراً m3u8
  if (directUrl) {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(directUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        statusEl.style.display = 'none';
        video.play();
      });
    }
    return;
  }

  // 2. إذا تم تمرير معرّف TMDB
  if (!id) {
    statusEl.innerText = 'يرجى تحديد المعرف عبر ?id= ❌';
    return;
  }

  try {
    statusEl.innerText = 'جاري جلب المشغل... ⏳';
    
    // جلب رابط التضمين من الـ API
    const query = new URLSearchParams({ type, id, ...(s && { s }), ...(e && { e }) });
    const response = await fetch(`/api/stream?${query.toString()}`);
    const data = await response.json();

    if (data.success && data.embedUrl) {
      // إخفاء وسم الفيديو وإنشاء iframe للمشغل
      video.style.display = 'none';
      statusEl.style.display = 'none';

      const iframe = document.createElement('iframe');
      iframe.src = data.embedUrl;
      iframe.style.width = '100vw';
      iframe.style.height = '100vh';
      iframe.style.border = 'none';
      iframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      
      document.body.appendChild(iframe);
    } else {
      statusEl.innerText = 'تعذر العثور على مصدر للبث ⚠️';
    }
  } catch (err) {
    statusEl.innerText = 'خطأ في الاتصال بالخادم ❌';
  }
});
