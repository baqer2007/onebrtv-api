document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const video = document.getElementById('videoPlayer');

  // 1. قراءة بيانات العمل من الرابط
  const urlParams = new URLSearchParams(window.location.search);
  const type = urlParams.get('type') || 'movie';
  const id = urlParams.get('id');
  const s = urlParams.get('s');
  const e = urlParams.get('e');
  const directUrl = urlParams.get('url');

  // دعم الروابط المباشرة القديمة إن وجدت
  if (directUrl) {
    playStream(directUrl);
    return;
  }

  if (!id) {
    statusEl.innerText = 'يرجى تحديد المعرف عبر ?id= ❌';
    return;
  }

  // 2. طلب بيانات البث من الـ API
  try {
    statusEl.innerText = 'جاري استخراج البث... ⏳';
    const query = new URLSearchParams({ type, id, ...(s && { s }), ...(e && { e }) });
    const response = await fetch(`/api/stream?${query.toString()}`);
    const data = await response.json();

    if (!data.success) {
      statusEl.innerText = data.message || 'تعذر جلب البث ⚠️';
      return;
    }

    statusEl.style.display = 'none';
    console.log('تم العثور على رابط التضمين:', data.embedUrl);
  } catch (err) {
    statusEl.innerText = 'خطأ في الاتصال بالخادم ❌';
  }

  function playStream(streamUrl) {
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        statusEl.style.display = 'none';
        video.play();
      });
    } else {
      video.src = streamUrl;
      video.play();
    }
  }
});
