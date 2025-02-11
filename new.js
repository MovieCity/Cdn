(function (window) {
    // Main player function
    window.customPlayer = function (elementId) {
        return new Player(elementId);
    };

    // Player class
    class Player {
        constructor(elementId) {
            this.container = document.getElementById(elementId);
            this.config = {};
            this.playerElement = null;
            this.controlsElement = null;
            this.isFullscreen = false;
            this.hls = null;
            this.qualities = [];
        }

        setup(config) {
            this.config = config;
            this.createPlayer();
            this.applyStyles();
            return this;
        }

        createPlayer() {
            // Create video element
            this.playerElement = document.createElement('video');
            this.playerElement.id = 'custom-video';
            this.playerElement.style.width = '100%';
            this.playerElement.style.height = '100%';

            // Create controls container
            this.controlsElement = document.createElement('div');
            this.controlsElement.className = 'custom-controls';

            // Initialize HLS.js if needed
            this.initHls();

            // Add controls
            this.createControls();
            
            // Append elements
            this.container.appendChild(this.playerElement);
            this.container.appendChild(this.controlsElement);
        }

        initHls() {
            const firstItem = this.config.playlist[0];
            const src = firstItem.sources[0].file;

            if (src.includes('.m3u8')) {
                if (Hls.isSupported()) {
                    this.hls = new Hls();
                    this.hls.loadSource(src);
                    this.hls.attachMedia(this.playerElement);
                    
                    // Auto-quality detection
                    this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        this.qualities = this.hls.levels.map((level, index) => ({
                            id: index,
                            label: level.height + 'p',
                            width: level.width,
                            height: level.height
                        }));
                        
                        // Auto-start if configured
                        if (this.config.autostart) this.playerElement.play();
                    });
                } else if (this.playerElement.canPlayType('application/vnd.apple.mpegurl')) {
                    // Native HLS support
                    this.playerElement.src = src;
                    this.playerElement.addEventListener('loadedmetadata', () => {
                        this.qualities = Array.from(this.playerElement.videoTracks).map(track => ({
                            label: track.label
                        }));
                    });
                }
            } else {
                // Regular MP4 source
                this.playerElement.src = src;
            }
        }

        createControls() {
            // Play/Pause Button
            const playButton = document.createElement('button');
            playButton.innerHTML = '&#9658;';
            playButton.addEventListener('click', () => this.togglePlayback());

            // Quality Selector
            const qualityButton = document.createElement('button');
            qualityButton.innerHTML = '&#9881;';
            qualityButton.addEventListener('click', () => this.showQualityMenu());

            // Progress Bar
            const progressBar = this.createProgressBar();

            // Append controls
            this.controlsElement.append(
                playButton,
                progressBar,
                qualityButton,
                this.createFullscreenButton()
            );
        }

        createProgressBar() {
            const container = document.createElement('div');
            container.className = 'custom-progress';
            
            this.progressFill = document.createElement('div');
            this.progressFill.className = 'custom-progress-fill';
            
            this.playerElement.addEventListener('timeupdate', () => {
                const progress = (this.playerElement.currentTime / this.playerElement.duration) * 100;
                this.progressFill.style.width = `${progress}%`;
            });

            container.appendChild(this.progressFill);
            return container;
        }

        showQualityMenu() {
            const menu = document.createElement('div');
            menu.className = 'custom-quality-menu';
            
            this.qualities.forEach(quality => {
                const button = document.createElement('button');
                button.textContent = quality.label;
                button.addEventListener('click', () => {
                    if (this.hls) this.hls.currentLevel = quality.id;
                    menu.remove();
                });
                menu.appendChild(button);
            });

            this.container.appendChild(menu);
        }

        // Other methods (togglePlayback, createFullscreenButton, etc.) remain similar
        // to previous implementation...
    }
})(window);
