document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const video = document.getElementById('videoPlayer');

  // قراءة المعرفات من الرابط
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'movie';
  const id = urlParams.get('id');
  const s = urlParams.get('s');
  const e = urlParams.get('e');

  if (!id) {
    statusEl.innerText = 'يرجى تحديد المعرف عبر ?id= ❌';
    return;
  }

  try {
    statusEl.innerText = 'جاري استخراج وفك تشفير البث... ⏳';

    const query = new URLSearchParams({ type, id, ...(s && { s }), ...(e && { e }) });
    const response = await fetch(`/api/stream?${query.toString()}`);
    const data = await response.json();

    if (data.success && data.streamUrl) {
      statusEl.style.display = 'none';
      playStream(data.streamUrl);
    } else {
      statusEl.innerText = 'تعذر استخراج رابط البث ⚠️';
    }
  } catch (err) {
    statusEl.innerText = 'خطأ في الاتصال بالسيرفر ❌';
  }

  // تشغيل ملف m3u8 داخل المشغل
  function playStream(streamUrl) {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.play();
    }
  }
});
