(function(){
  "use strict";
  
  // Get configuration from HTML (or set defaults)
  var config = window.RuriORGConfig || {
    file: '',
    image: '',
    width: 640,
    aspectratio: '16:9',
    live: false
  };

  // Utility: Dynamically load an external script.
  function loadScript(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onload = callback;
    script.onerror = function() {
      console.error('Failed to load script: ' + url);
    };
    document.head.appendChild(script);
  }
  
  // Create main container using a responsive aspect ratio technique.
  var containerId = 'ruriorg-container';
  var container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }
  container.classList.add('ruriorg-container');
  // Make the container responsive.
  container.style.width = "100%";
  container.style.maxWidth = config.width + "px";
  container.style.position = "relative";
  // Calculate aspect ratio percentage (e.g. 16:9 → 56.25%)
  if (config.aspectratio) {
    var parts = config.aspectratio.split(':');
    if (parts.length === 2) {
      var ratio = parseInt(parts[1], 10) / parseInt(parts[0], 10) * 100;
      container.style.paddingBottom = ratio + "%";
    }
  } else {
    container.style.paddingBottom = "56.25%";
  }
  container.style.margin = "20px auto";
  container.style.backgroundColor = "#000";
  container.style.overflow = "hidden";

  // Create the HTML5 video element.
  var video = document.createElement('video');
  video.id = 'ruriorg-video';
  video.classList.add('ruriorg-video');
  // Position the video absolutely to fill the container.
  video.style.position = "absolute";
  video.style.top = "0";
  video.style.left = "0";
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.backgroundColor = "#000";
  video.controls = false; // We'll build custom controls.
  container.appendChild(video);

  // --- HLS Support ---
  if (config.file && config.file.match(/\.m3u8$/)) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = config.file;
    } else if (window.Hls) {
      var hls = new Hls();
      hls.loadSource(config.file);
      hls.attachMedia(video);
    } else {
      loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest', function(){
        if (window.Hls) {
          var hls = new Hls();
          hls.loadSource(config.file);
          hls.attachMedia(video);
        } else {
          console.error('HLS is not supported and hls.js could not be loaded.');
        }
      });
    }
  } else {
    video.src = config.file;
  }

  // --- Subtitles (VTT) ---
  if (config.subtitles && config.subtitles.src) {
    var track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = config.subtitles.label || 'Subtitles';
    track.srclang = config.subtitles.srclang || 'en';
    track.src = config.subtitles.src;
    track.default = true;
    video.appendChild(track);
  }

  // --- Build Control Bar (Transparent) ---
  var controls = document.createElement('div');
  controls.id = 'ruriorg-controls';
  controls.classList.add('ruriorg-controls');
  controls.style.position = "absolute";
  controls.style.bottom = "0";
  controls.style.left = "0";
  controls.style.width = "100%";
  // Remove background and border
  controls.style.background = "transparent";
  controls.style.borderTop = "none";
  controls.style.color = "#fff";
  controls.style.padding = "8px 10px";
  controls.style.boxSizing = "border-box";
  controls.style.display = "flex";
  controls.style.alignItems = "center";
  controls.style.transition = "opacity 0.3s ease";
  controls.style.opacity = "1";
  container.appendChild(controls);

  // 10-Second Rewind Button.
  var rewindBtn = document.createElement('button');
  rewindBtn.id = 'ruriorg-rewind';
  rewindBtn.classList.add('ruriorg-rewind');
  rewindBtn.innerHTML = '<i class="material-icons">replay_10</i>';
  rewindBtn.style.marginRight = "10px";
  rewindBtn.style.cursor = "pointer";
  rewindBtn.style.background = "none";
  rewindBtn.style.border = "none";
  rewindBtn.style.outline = "none";
  rewindBtn.style.color = "inherit";
  rewindBtn.style.fontSize = "24px";
  controls.appendChild(rewindBtn);

  // Play/Pause Button.
  var playPauseBtn = document.createElement('button');
  playPauseBtn.id = 'ruriorg-playpause';
  playPauseBtn.classList.add('ruriorg-playpause');
  playPauseBtn.innerHTML = '<i class="material-icons">play_arrow</i>';
  playPauseBtn.style.marginRight = "10px";
  playPauseBtn.style.cursor = "pointer";
  playPauseBtn.style.background = "none";
  playPauseBtn.style.border = "none";
  playPauseBtn.style.outline = "none";
  playPauseBtn.style.color = "inherit";
  playPauseBtn.style.fontSize = "24px";
  controls.appendChild(playPauseBtn);

  // 10-Second Forward Button.
  var forwardBtn = document.createElement('button');
  forwardBtn.id = 'ruriorg-forward';
  forwardBtn.classList.add('ruriorg-forward');
  forwardBtn.innerHTML = '<i class="material-icons">forward_10</i>';
  forwardBtn.style.marginRight = "10px";
  forwardBtn.style.cursor = "pointer";
  forwardBtn.style.background = "none";
  forwardBtn.style.border = "none";
  forwardBtn.style.outline = "none";
  forwardBtn.style.color = "inherit";
  forwardBtn.style.fontSize = "24px";
  controls.appendChild(forwardBtn);

  // Progress Bar Container.
  var progressContainer = document.createElement('div');
  progressContainer.id = 'ruriorg-progress-container';
  progressContainer.classList.add('ruriorg-progress-container');
  progressContainer.style.flex = "1";
  progressContainer.style.height = "8px";
  progressContainer.style.background = "#555";
  progressContainer.style.marginRight = "10px";
  progressContainer.style.cursor = "pointer";
  progressContainer.style.position = "relative";
  controls.appendChild(progressContainer);

  // Progress Indicator.
  var progressBar = document.createElement('div');
  progressBar.id = 'ruriorg-progress';
  progressBar.classList.add('ruriorg-progress');
  progressBar.style.width = "0%";
  progressBar.style.height = "100%";
  progressBar.style.background = "#f00";
  progressContainer.appendChild(progressBar);

  // Time Display (or Live Indicator).
  var timeDisplay = document.createElement('span');
  timeDisplay.id = 'ruriorg-timedisplay';
  timeDisplay.classList.add('ruriorg-timedisplay');
  timeDisplay.style.marginLeft = "10px";
  if (config.live) {
    timeDisplay.innerHTML = '<i class="material-icons">live_tv</i> LIVE';
  } else {
    timeDisplay.textContent = "00:00 / 00:00";
  }
  controls.appendChild(timeDisplay);

  // Volume Icon.
  var volumeIcon = document.createElement('span');
  volumeIcon.id = 'ruriorg-volume-icon';
  volumeIcon.classList.add('ruriorg-volume-icon');
  volumeIcon.innerHTML = '<i class="material-icons">volume_up</i>';
  volumeIcon.style.marginLeft = "10px";
  volumeIcon.style.cursor = "pointer";
  volumeIcon.style.fontSize = "24px";
  controls.appendChild(volumeIcon);

  // Volume Slider.
  var volumeControl = document.createElement('input');
  volumeControl.id = 'ruriorg-volume';
  volumeControl.classList.add('ruriorg-volume');
  volumeControl.type = 'range';
  volumeControl.min = 0;
  volumeControl.max = 1;
  volumeControl.step = 0.01;
  volumeControl.value = 1;
  volumeControl.style.marginLeft = "5px";
  volumeControl.style.cursor = "pointer";
  controls.appendChild(volumeControl);

  // Fullscreen Button.
  var fullscreenBtn = document.createElement('button');
  fullscreenBtn.id = 'ruriorg-fullscreen';
  fullscreenBtn.classList.add('ruriorg-fullscreen');
  fullscreenBtn.innerHTML = '<i class="material-icons">fullscreen</i>';
  fullscreenBtn.style.marginLeft = "10px";
  fullscreenBtn.style.cursor = "pointer";
  fullscreenBtn.style.background = "none";
  fullscreenBtn.style.border = "none";
  fullscreenBtn.style.outline = "none";
  fullscreenBtn.style.color = "inherit";
  fullscreenBtn.style.fontSize = "24px";
  controls.appendChild(fullscreenBtn);

  // --- Video Preview Setup (unchanged) ---
  var previewCues = [];
  if (config.preview && config.preview.vtt && config.preview.image) {
    fetch(config.preview.vtt)
      .then(function(response) { return response.text(); })
      .then(function(text) { previewCues = parseVTT(text); })
      .catch(function(err) { console.error("Failed to load preview VTT:", err); });
  }
  var previewContainer = document.createElement('div');
  previewContainer.id = 'ruriorg-preview';
  previewContainer.classList.add('ruriorg-preview');
  previewContainer.style.position = 'absolute';
  previewContainer.style.bottom = '50px';
  previewContainer.style.display = 'none';
  previewContainer.style.overflow = 'hidden';
  previewContainer.style.border = 'none';
  previewContainer.style.backgroundColor = 'transparent';
  container.appendChild(previewContainer);
  var previewImage = document.createElement('img');
  previewImage.id = 'ruriorg-preview-image';
  previewImage.classList.add('ruriorg-preview-image');
  previewImage.src = (config.preview && config.preview.image) || '';
  previewImage.style.position = 'relative';
  previewContainer.appendChild(previewImage);

  // --- Event Listeners & Functionality ---

  // Toggle play/pause.
  playPauseBtn.addEventListener('click', function(){
    if (video.paused) { video.play(); }
    else { video.pause(); }
  });
  video.addEventListener('play', function(){
    playPauseBtn.innerHTML = '<i class="material-icons">pause</i>';
    resetControlsTimer();
  });
  video.addEventListener('pause', function(){
    playPauseBtn.innerHTML = '<i class="material-icons">play_arrow</i>';
    if (controlsTimeout) clearTimeout(controlsTimeout);
    controls.style.opacity = "1";
  });
  // Rewind 10 seconds.
  rewindBtn.addEventListener('click', function(){
    video.currentTime = Math.max(video.currentTime - 10, 0);
  });
  // Forward 10 seconds.
  forwardBtn.addEventListener('click', function(){
    if (video.duration) {
      video.currentTime = Math.min(video.currentTime + 10, video.duration);
    }
  });
  // Update progress bar and time display.
  video.addEventListener('timeupdate', function(){
    if (!config.live && video.duration) {
      var percent = (video.currentTime / video.duration) * 100;
      progressBar.style.width = percent + "%";
      timeDisplay.textContent = formatTime(video.currentTime) + " / " + formatTime(video.duration);
    }
  });
  // Seek via progress bar click.
  progressContainer.addEventListener('click', function(e){
    if (!video.duration) return;
    var rect = progressContainer.getBoundingClientRect();
    var clickPos = e.clientX - rect.left;
    var newTime = (clickPos / rect.width) * video.duration;
    video.currentTime = newTime;
  });
  // Update volume.
  volumeControl.addEventListener('input', function(){
    video.volume = volumeControl.value;
    volumeIcon.innerHTML = (video.volume == 0)
      ? '<i class="material-icons">volume_off</i>'
      : '<i class="material-icons">volume_up</i>';
  });
  // Fullscreen toggle.
  fullscreenBtn.addEventListener('click', function(){
    if (!document.fullscreenElement) {
      if (container.requestFullscreen) { container.requestFullscreen(); }
      else if (container.mozRequestFullScreen) { container.mozRequestFullScreen(); }
      else if (container.webkitRequestFullscreen) { container.webkitRequestFullscreen(); }
      else if (container.msRequestFullscreen) { container.msRequestFullscreen(); }
    } else {
      if (document.exitFullscreen) { document.exitFullscreen(); }
    }
  });
  // Video preview on hover.
  progressContainer.addEventListener('mousemove', function(e) {
    if (previewCues.length === 0 || !video.duration) return;
    var rect = progressContainer.getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var time = (mouseX / rect.width) * video.duration;
    var cue = null;
    for (var i = 0; i < previewCues.length; i++) {
      if (time >= previewCues[i].start && time <= previewCues[i].end) { cue = previewCues[i]; break; }
    }
    if (cue) {
      previewContainer.style.width = cue.w + "px";
      previewContainer.style.height = cue.h + "px";
      var containerRect = container.getBoundingClientRect();
      var previewLeft = e.clientX - containerRect.left - (cue.w / 2);
      if (previewLeft < 0) previewLeft = 0;
      if (previewLeft + cue.w > container.clientWidth) { previewLeft = container.clientWidth - cue.w; }
      previewContainer.style.left = previewLeft + "px";
      previewImage.style.left = -cue.x + "px";
      previewImage.style.top = -cue.y + "px";
      previewContainer.style.display = 'block';
    } else { previewContainer.style.display = 'none'; }
  });
  progressContainer.addEventListener('mouseleave', function() { previewContainer.style.display = 'none'; });

  // --- Auto-Hide Controls ---
  var controlsTimeout;
  function resetControlsTimer(){
    if (controlsTimeout) clearTimeout(controlsTimeout);
    controls.style.opacity = "1";
    if (!video.paused) {
      controlsTimeout = setTimeout(function(){ controls.style.opacity = "0"; }, 3000);
    }
  }
  container.addEventListener('mousemove', resetControlsTimer);
  container.addEventListener('mouseenter', function(){ controls.style.opacity = "1"; resetControlsTimer(); });

  // --- Dual Tap Gesture for 10-sec Skip ---
  var lastTap = 0;
  container.addEventListener("touchend", function(e) {
    var currentTime = new Date().getTime();
    var tapLength = currentTime - lastTap;
    if (tapLength < 300 && tapLength > 0) {
      var touch = e.changedTouches[0];
      var rect = container.getBoundingClientRect();
      var x = touch.clientX - rect.left;
      if (x < rect.width / 2) {
        video.currentTime = Math.max(video.currentTime - 10, 0);
      } else {
        if (video.duration)
          video.currentTime = Math.min(video.currentTime + 10, video.duration);
      }
      e.preventDefault();
    }
    lastTap = currentTime;
  });

  // --- Utility Functions ---
  function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    var minutes = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return (minutes < 10 ? "0" + minutes : minutes) + ":" + (secs < 10 ? "0" + secs : secs);
  }
  
  function parseTime(timeString) {
    var parts = timeString.split(':');
    var seconds = 0;
    if (parts.length === 3)
      seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
    else if (parts.length === 2)
      seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
    else
      seconds = parseFloat(parts[0]);
    return seconds;
  }
  
  // Parse a simple VTT file for preview data.
  // Expected cue format:
  //   00:00.000 --> 00:05.000
  //   x:0,y:0,w:160,h:90
  function parseVTT(vttText) {
    var cues = [];
    var lines = vttText.split(/\r?\n/);
    var cue = null;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) {
        if (cue) { cues.push(cue); cue = null; }
        continue;
      }
      if (i === 0 && line.indexOf("WEBVTT") === 0) continue;
      if (line.indexOf('-->') !== -1) {
        var times = line.split('-->');
        if (times.length === 2) {
          cue = {
            start: parseTime(times[0].trim()),
            end: parseTime(times[1].trim())
          };
        }
      } else if (cue) {
        var parts = line.split(',');
        parts.forEach(function(part) {
          var kv = part.split(':');
          if (kv.length === 2) {
            var key = kv[0].trim();
            var value = parseInt(kv[1].trim(), 10);
            cue[key] = value;
          }
        });
      }
    }
    if (cue) { cues.push(cue); }
    return cues;
  }
  
  // Expose a global API for further customization.
  window.RuriORG = {
    container: container,
    video: video,
    controls: controls,
    playPauseBtn: playPauseBtn,
    rewindBtn: rewindBtn,
    forwardBtn: forwardBtn,
    progressContainer: progressContainer,
    progressBar: progressBar,
    timeDisplay: timeDisplay,
    volumeIcon: volumeIcon,
    volumeControl: volumeControl,
    fullscreenBtn: fullscreenBtn,
    previewContainer: previewContainer,
    previewImage: previewImage
  };

  if (window.jQuery) {
    jQuery(container).trigger('ruriorg:ready', window.RuriORG);
  }
})();
 
