// Buffer these short clips so browser seeking works on static hosts that return full files.
for (const video of document.querySelectorAll('video[src]')) {
  const source = video.getAttribute('src');
  const autoplay = video.autoplay;
  if (autoplay) video.pause();
  fetch(source).then(response => {
    if (!response.ok) throw new Error('Video request failed');
    return response.blob();
  }).then(blob => {
    const position = video.currentTime;
    const objectUrl = URL.createObjectURL(blob);
    video.addEventListener('loadedmetadata', () => {
      if (position > 0 && position < video.duration) video.currentTime = position;
      if (autoplay) video.play().catch(() => {});
    }, {once:true});
    video.src = objectUrl;
    video.load();
  }).catch(() => {
    if (autoplay) video.play().catch(() => {});
  });
}
