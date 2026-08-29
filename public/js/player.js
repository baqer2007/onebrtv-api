document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const video = document.getElementById('videoPlayer');

  // قراءة المعرفات من رابط الصفحة
  const urlParams = new URLSearchParams(window.location.search);
  const episodeId = urlParams.get('episodeId');
  const mediaId = urlParams.get('mediaId');

  if (!episodeId || !mediaId) {
    statusEl.innerText = 'خطأ: لم يتم تحديد معرف الحلقة أو العمل ❌';
    return;
  }

  try {
    // جلب البيانات من الخادم
    const response = await fetch(`/api/stream?episodeId=${encodeURIComponent(episodeId)}&mediaId=${encodeURIComponent(mediaId)}`);
    const data = await response.json();

    if (!data.success || !data.sources || data.sources.length === 0) {
      statusEl.innerText = 'تعذر العثور على مصادر بث صالحة ⚠️';
      return;
    }

    // تحديد مسار الفيديو الأنسب
    const streamSource = data.sources.find(s => s.quality === 'auto') || data.sources[0];
    const streamUrl = streamSource.url;

    // إضافة ملفات الترجمة المتاحة
    if (data.subtitles && data.subtitles.length > 0) {
      data.subtitles.forEach(sub => {
        if (sub.lang && sub.url) {
          const track = document.createElement('track');
          track.kind = 'subtitles';
          track.label = sub.lang;
          track.srclang = sub.lang.substring(0, 2).toLowerCase();
          track.src = sub.url;
          if (sub.lang.toLowerCase().includes('arabic') || sub.lang.toLowerCase().includes('ara')) {
            track.default = true;
          }
          video.appendChild(track);
        }
      });
    }

    // تشغيل البث عبر Hls.js
    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        statusEl.style.display = 'none';
        video.play().catch(() => {
          console.log('يتطلب المتصفح تفاعلاً لبدء التشغيل');
        });
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          statusEl.innerText = 'حدث خطأ أثناء تشغيل مقطع الفيديو ❌';
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        statusEl.style.display = 'none';
        video.play();
      });
    } else {
      statusEl.innerText = 'المتصفح لا يدعم تشغيل هذا البث ⚠️';
    }

  } catch (error) {
    console.error(error);
    statusEl.innerText = 'تعذر الاتصال بالخادم لجلب الفيديو 🔌';
  }
});
