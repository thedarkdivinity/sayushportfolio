export class UI {
    constructor(app) {
        this.app = app;
        this.currentSection = 'home';
        this.introHidden = false;

        this.speedDisplay = document.querySelector('.speed-value');
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.sections = document.querySelectorAll('.content-section');
        this.soundToggle = document.getElementById('sound-toggle');
        this.minimapCanvas = document.getElementById('minimap-canvas');
        this.minimapCtx = this.minimapCanvas?.getContext('2d');
        this.playerMarker = document.getElementById('player-marker');
        this.homeSection = document.getElementById('home-section');

        this.setupNavigation();
        this.setupOptions();
        this.setupSoundToggle();
        this.setupMinimap();

        // Auto-hide intro after 5 seconds
        this.autoHideTimeout = setTimeout(() => {
            this.hideIntro();
        }, 5000);
    }

    setupNavigation() {
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.showSection(section);
            });
        });

        // Logo click returns to home
        const logo = document.querySelector('.logo');
        if (logo) {
            logo.addEventListener('click', () => {
                this.showSection('home');
            });
        }

        // Keyboard shortcut to close sections
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.hideAllSections();
            }
        });
    }

    showSection(sectionId) {
        // Update nav buttons
        this.navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === sectionId);
        });

        // Update sections
        this.sections.forEach(section => {
            const isActive = section.id === `${sectionId}-section`;
            section.classList.toggle('active', isActive);
        });

        this.currentSection = sectionId;
    }

    hideAllSections() {
        this.sections.forEach(section => {
            section.classList.remove('active');
        });
        this.navButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        this.currentSection = null;
    }

    hideIntro() {
        if (this.introHidden) return;
        this.introHidden = true;

        if (this.homeSection) {
            this.homeSection.classList.remove('active');
        }

        // Clear the timeout if it exists
        if (this.autoHideTimeout) {
            clearTimeout(this.autoHideTimeout);
            this.autoHideTimeout = null;
        }

        // Deactivate home nav button
        this.navButtons.forEach(btn => {
            if (btn.dataset.section === 'home') {
                btn.classList.remove('active');
            }
        });

        this.currentSection = null;
    }

    setupOptions() {
        // Quality buttons
        const qualityBtns = document.querySelectorAll('.option-btn[data-quality]');
        qualityBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                qualityBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.app.updateSettings({ quality: btn.dataset.quality });
            });
        });

        // Toggle switches
        const shadowsToggle = document.getElementById('shadows-toggle');
        if (shadowsToggle) {
            shadowsToggle.addEventListener('change', () => {
                this.app.updateSettings({ shadows: shadowsToggle.checked });
            });
        }

        const sfxToggle = document.getElementById('sfx-toggle');
        if (sfxToggle) {
            sfxToggle.addEventListener('change', () => {
                this.app.updateSettings({ sfx: sfxToggle.checked });
            });
        }

        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.addEventListener('change', () => {
                this.app.updateSettings({ music: musicToggle.checked });
            });
        }

        const shakeToggle = document.getElementById('shake-toggle');
        if (shakeToggle) {
            shakeToggle.addEventListener('change', () => {
                this.app.settings.cameraShake = shakeToggle.checked;
            });
        }
    }

    setupSoundToggle() {
        if (this.soundToggle) {
            this.soundToggle.addEventListener('click', () => {
                this.soundToggle.classList.toggle('muted');
                const isMuted = this.soundToggle.classList.contains('muted');
                this.app.audio?.setMasterMute(isMuted);
            });
        }
    }

    setupMinimap() {
        if (!this.minimapCanvas) return;

        // Set canvas size
        this.minimapCanvas.width = 150;
        this.minimapCanvas.height = 150;

        // Draw minimap background
        this.drawMinimap();
    }

    drawMinimap() {
        if (!this.minimapCtx) return;

        const ctx = this.minimapCtx;
        const size = 150;
        const scale = 1.5;

        // Clear
        ctx.fillStyle = '#16213e';
        ctx.fillRect(0, 0, size, size);

        // Draw roads
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 4;

        // Circular road
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, 40 / scale, 0, Math.PI * 2);
        ctx.stroke();

        // Straight roads
        ctx.beginPath();
        ctx.moveTo(size / 2, size / 2);
        ctx.lineTo(size / 2, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        ctx.stroke();

        // Draw buildings as dots
        ctx.fillStyle = '#ff6b35';
        const buildingPositions = [
            { x: 60, z: 60 },
            { x: -60, z: 60 },
            { x: 60, z: -60 },
            { x: -60, z: -60 }
        ];

        buildingPositions.forEach(pos => {
            const mapX = size / 2 + pos.x / scale;
            const mapZ = size / 2 - pos.z / scale;
            ctx.fillRect(mapX - 2, mapZ - 2, 4, 4);
        });
    }

    update(motorcycle) {
        // Update speed display
        const speed = Math.abs(motorcycle.getSpeed());
        if (this.speedDisplay) {
            this.speedDisplay.textContent = Math.round(speed);
        }

        // Auto-hide intro when motorcycle is moving
        if (!this.introHidden && motorcycle.isMoving()) {
            this.hideIntro();
        }

        // Update player marker on minimap
        if (this.playerMarker && this.minimapCanvas) {
            const pos = motorcycle.getPosition();
            const rotation = motorcycle.getRotation();
            const scale = 1.5;
            const size = 150;

            const mapX = size / 2 + pos.x / scale;
            const mapZ = size / 2 - pos.z / scale;

            // Clamp to minimap bounds
            const clampedX = Math.max(5, Math.min(size - 5, mapX));
            const clampedZ = Math.max(5, Math.min(size - 5, mapZ));

            this.playerMarker.style.left = `${clampedX}px`;
            this.playerMarker.style.top = `${clampedZ}px`;
            this.playerMarker.style.transform = `translate(-50%, -50%) rotate(${-rotation}rad)`;
        }
    }
}
