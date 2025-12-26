export class Audio {
    constructor(settings) {
        this.settings = settings;
        this.masterMuted = false;

        // Audio context for Web Audio API
        this.audioContext = null;
        this.sounds = {};

        // Initialize on user interaction (required by browsers)
        this.initialized = false;
        this.musicPlaying = false;
        this.initOnInteraction();
    }

    initOnInteraction() {
        const initAudio = () => {
            if (this.initialized) return;

            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;

                // Create master gain node
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 0.7;
                this.masterGain.connect(this.audioContext.destination);

                // Create separate gain nodes for music and sfx
                this.musicGain = this.audioContext.createGain();
                this.musicGain.gain.value = 0.3;
                this.musicGain.connect(this.masterGain);

                this.sfxGain = this.audioContext.createGain();
                this.sfxGain.gain.value = 0.5;
                this.sfxGain.connect(this.masterGain);

                // Create engine sound
                this.createEngineSounds();

            } catch (e) {
                console.warn('Audio initialization failed:', e);
            }

            // Remove listeners after initialization
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
            document.removeEventListener('touchstart', initAudio);
        };

        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
        document.addEventListener('touchstart', initAudio);
    }

    createEngineSounds() {
        if (!this.audioContext) return;

        // Create multiple oscillators for richer engine sound
        this.engineOscillators = [];
        this.engineGains = [];

        // Main engine tone
        const osc1 = this.audioContext.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = 55;

        const gain1 = this.audioContext.createGain();
        gain1.gain.value = 0;

        // Secondary harmonic
        const osc2 = this.audioContext.createOscillator();
        osc2.type = 'square';
        osc2.frequency.value = 110;

        const gain2 = this.audioContext.createGain();
        gain2.gain.value = 0;

        // Low rumble
        const osc3 = this.audioContext.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.value = 30;

        const gain3 = this.audioContext.createGain();
        gain3.gain.value = 0;

        // Filter for engine character
        this.engineFilter = this.audioContext.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.value = 600;
        this.engineFilter.Q.value = 2;

        // Distortion for grit
        this.engineDistortion = this.audioContext.createWaveShaper();
        this.engineDistortion.curve = this.makeDistortionCurve(20);

        // Connect oscillators
        osc1.connect(gain1);
        osc2.connect(gain2);
        osc3.connect(gain3);

        gain1.connect(this.engineFilter);
        gain2.connect(this.engineFilter);
        gain3.connect(this.engineFilter);

        this.engineFilter.connect(this.engineDistortion);
        this.engineDistortion.connect(this.sfxGain);

        // Store references
        this.engineOscillators = [osc1, osc2, osc3];
        this.engineGains = [gain1, gain2, gain3];

        // Start oscillators
        osc1.start();
        osc2.start();
        osc3.start();
    }

    makeDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        return curve;
    }

    playAmbient() {
        if (!this.initialized || this.musicPlaying || !this.settings.music) return;

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.musicPlaying = true;
        this.startAmbientMusic();
    }

    startAmbientMusic() {
        if (!this.audioContext || !this.settings.music) return;

        // Create ambient music using procedural generation
        // Lo-fi chill vibes with simple chord progression
        const chords = [
            [261.63, 329.63, 392.00], // C major
            [293.66, 369.99, 440.00], // D minor
            [349.23, 440.00, 523.25], // F major
            [392.00, 493.88, 587.33], // G major
        ];

        let chordIndex = 0;

        const playChord = () => {
            if (!this.settings.music || this.masterMuted) {
                setTimeout(playChord, 4000);
                return;
            }

            const chord = chords[chordIndex % chords.length];
            chordIndex++;

            chord.forEach((freq, i) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.value = freq / 2; // Lower octave for ambient feel

                filter.type = 'lowpass';
                filter.frequency.value = 800;

                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.5);
                gain.gain.linearRampToValueAtTime(0.05, this.audioContext.currentTime + 2);
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 3.8);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.musicGain);

                osc.start();
                osc.stop(this.audioContext.currentTime + 4);
            });

            // Add subtle pad
            const pad = this.audioContext.createOscillator();
            const padGain = this.audioContext.createGain();
            const padFilter = this.audioContext.createBiquadFilter();

            pad.type = 'triangle';
            pad.frequency.value = chord[0] / 4;

            padFilter.type = 'lowpass';
            padFilter.frequency.value = 400;

            padGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            padGain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 1);
            padGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 3.5);

            pad.connect(padFilter);
            padFilter.connect(padGain);
            padGain.connect(this.musicGain);

            pad.start();
            pad.stop(this.audioContext.currentTime + 4);

            setTimeout(playChord, 4000);
        };

        playChord();
    }

    updateEngine(speed, throttle) {
        if (!this.engineOscillators || !this.settings.sfx || this.masterMuted) {
            this.engineGains?.forEach(g => {
                if (g) g.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
            });
            return;
        }

        const absSpeed = Math.abs(speed);
        const rpm = 800 + absSpeed * 50; // RPM simulation

        // Update oscillator frequencies based on "RPM"
        const baseFreq = 30 + (rpm / 100);
        this.engineOscillators[0].frequency.setTargetAtTime(baseFreq, this.audioContext.currentTime, 0.05);
        this.engineOscillators[1].frequency.setTargetAtTime(baseFreq * 2, this.audioContext.currentTime, 0.05);
        this.engineOscillators[2].frequency.setTargetAtTime(baseFreq * 0.5, this.audioContext.currentTime, 0.05);

        // Volume based on throttle and speed
        const baseVolume = throttle ? 0.15 : 0.05;
        const speedVolume = Math.min(absSpeed / 50, 1) * 0.1;
        const totalVolume = baseVolume + speedVolume;

        this.engineGains[0].gain.setTargetAtTime(totalVolume, this.audioContext.currentTime, 0.05);
        this.engineGains[1].gain.setTargetAtTime(totalVolume * 0.5, this.audioContext.currentTime, 0.05);
        this.engineGains[2].gain.setTargetAtTime(totalVolume * 0.7, this.audioContext.currentTime, 0.05);

        // Filter based on throttle
        const filterFreq = throttle ? 1200 + absSpeed * 10 : 400 + absSpeed * 5;
        this.engineFilter.frequency.setTargetAtTime(filterFreq, this.audioContext.currentTime, 0.1);
    }

    playHorn() {
        if (!this.audioContext || !this.settings.sfx || this.masterMuted) return;

        // Classic motorcycle horn sound
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc1.type = 'square';
        osc1.frequency.value = 400;

        osc2.type = 'square';
        osc2.frequency.value = 500;

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.3);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.sfxGain);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.4);
        osc2.stop(this.audioContext.currentTime + 0.4);
    }

    playSfx(name) {
        if (!this.settings.sfx || this.masterMuted || !this.initialized) return;
        this.playTone(name);
    }

    playTone(type) {
        if (!this.audioContext) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.sfxGain);

        switch (type) {
            case 'impact':
                osc.frequency.value = 80;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                break;
            case 'skid':
                osc.frequency.value = 150;
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                break;
            default:
                osc.frequency.value = 300;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        }

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }

    setSfxEnabled(enabled) {
        this.settings.sfx = enabled;
        if (this.sfxGain) {
            this.sfxGain.gain.value = enabled ? 0.5 : 0;
        }
    }

    setMusicEnabled(enabled) {
        this.settings.music = enabled;
        if (this.musicGain) {
            this.musicGain.gain.value = enabled ? 0.3 : 0;
        }
    }

    setMasterMute(muted) {
        this.masterMuted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : 0.7;
        }
    }

    dispose() {
        this.engineOscillators?.forEach(osc => osc.stop());
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
