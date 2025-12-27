import * as THREE from 'three';
import { ToyotaInnova } from './ToyotaInnova.js';
import { Motorcycle } from './Motorcycle.js';

/**
 * CheatCodeManager - Detects keyboard sequences and triggers vehicle transformation
 * Type "car" to transform bike into Toyota Innova
 * Type "bike" to transform back to motorcycle
 */
export class CheatCodeManager {
    constructor(app) {
        this.app = app;
        this.inputBuffer = [];
        this.maxBufferLength = 10;
        this.isTransforming = false;

        // Cheat codes mapping
        this.cheatCodes = {
            'car': () => this.transformToInnova(),
            'bike': () => this.transformToMotorcycle(),
            'speed': () => this.toggleSpeedBoost(),
            'night': () => this.toggleNightMode(),
            'fly': () => this.toggleFlyMode()
        };

        // Active cheats
        this.speedBoostActive = false;
        this.flyModeActive = false;

        // Transform effect
        this.transformEffect = null;

        this.setupKeyListener();
    }

    setupKeyListener() {
        window.addEventListener('keydown', (e) => {
            // Only track letter keys, ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.code.startsWith('Key')) {
                const letter = e.code.replace('Key', '').toLowerCase();
                this.inputBuffer.push(letter);

                // Trim buffer to max length
                if (this.inputBuffer.length > this.maxBufferLength) {
                    this.inputBuffer.shift();
                }

                this.checkCheatCodes();
            }
        });
    }

    checkCheatCodes() {
        const bufferString = this.inputBuffer.join('');

        for (const [code, action] of Object.entries(this.cheatCodes)) {
            if (bufferString.endsWith(code)) {
                console.log(`Cheat code activated: ${code}`);
                action();
                this.inputBuffer = []; // Reset buffer
                break;
            }
        }
    }

    async transformToInnova() {
        if (this.isTransforming) return;
        if (this.app.activeVehicle?.getType() === 'car') {
            this.showMessage('Already driving a car!');
            return;
        }

        this.isTransforming = true;

        // Store current position and rotation
        const currentPos = this.app.activeVehicle.getPosition().clone();
        const currentRot = this.app.activeVehicle.getRotation();
        const obstacles = this.app.activeVehicle.obstacles;

        // Play transform effect
        await this.playTransformEffect(currentPos);

        // Remove current vehicle from scene
        this.app.activeVehicle.destroy();

        // Create Toyota Innova
        const innova = new ToyotaInnova(this.app.scene, this.app.world, this.app.isNightMode);
        await innova.create();

        // Transfer position and rotation
        innova.setPosition(currentPos);
        innova.setRotation(currentRot);

        // Transfer obstacles
        obstacles.forEach(obs => {
            innova.addObstacle(obs.x, obs.z, obs.width, obs.depth);
        });

        // Update app reference
        this.app.activeVehicle = innova;
        this.app.innova = innova;

        // Update controls
        if (this.app.controls) {
            this.app.controls.setVehicle(innova);
        }

        // Update NPC manager's player reference for pedestrian collision
        if (this.app.npcManager) {
            this.app.npcManager.setPlayerVehicle(innova);
        }

        this.showMessage('Transformed into Toyota Innova!');
        this.isTransforming = false;
    }

    async transformToMotorcycle() {
        if (this.isTransforming) return;
        if (this.app.activeVehicle?.getType() === 'motorcycle') {
            this.showMessage('Already riding a motorcycle!');
            return;
        }

        this.isTransforming = true;

        // Store current position and rotation
        const currentPos = this.app.activeVehicle.getPosition().clone();
        const currentRot = this.app.activeVehicle.getRotation();
        const obstacles = this.app.activeVehicle.obstacles;

        // Play transform effect
        await this.playTransformEffect(currentPos);

        // Remove current vehicle from scene
        this.app.activeVehicle.destroy();

        // Create Motorcycle
        const motorcycle = new Motorcycle(this.app.scene, this.app.world, this.app.isNightMode);
        await motorcycle.create();

        // Transfer position and rotation
        motorcycle.setPosition(currentPos);
        motorcycle.setRotation(currentRot);

        // Transfer obstacles
        obstacles.forEach(obs => {
            motorcycle.addObstacle(obs.x, obs.z, obs.width, obs.depth);
        });

        // Update app reference
        this.app.activeVehicle = motorcycle;
        this.app.motorcycle = motorcycle;

        // Update controls
        if (this.app.controls) {
            this.app.controls.setVehicle(motorcycle);
        }

        // Update NPC manager's player reference for pedestrian collision
        if (this.app.npcManager) {
            this.app.npcManager.setPlayerVehicle(motorcycle);
        }

        this.showMessage('Transformed into Motorcycle!');
        this.isTransforming = false;
    }

    async playTransformEffect(position) {
        return new Promise((resolve) => {
            // Create particle burst effect
            const particleCount = 50;
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const velocities = [];

            for (let i = 0; i < particleCount; i++) {
                positions[i * 3] = position.x;
                positions[i * 3 + 1] = position.y + 1;
                positions[i * 3 + 2] = position.z;

                velocities.push({
                    x: (Math.random() - 0.5) * 10,
                    y: Math.random() * 5 + 2,
                    z: (Math.random() - 0.5) * 10
                });
            }

            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const material = new THREE.PointsMaterial({
                color: 0xffff00,
                size: 0.3,
                transparent: true,
                opacity: 1
            });

            const particles = new THREE.Points(geometry, material);
            this.app.scene.add(particles);

            // Flash effect
            const flash = new THREE.PointLight(0xffff00, 10, 20);
            flash.position.copy(position);
            flash.position.y += 1;
            this.app.scene.add(flash);

            // Animate particles
            let elapsed = 0;
            const duration = 0.5;

            const animate = () => {
                elapsed += 0.016;

                const posArray = particles.geometry.attributes.position.array;
                for (let i = 0; i < particleCount; i++) {
                    posArray[i * 3] += velocities[i].x * 0.016;
                    posArray[i * 3 + 1] += velocities[i].y * 0.016;
                    posArray[i * 3 + 2] += velocities[i].z * 0.016;
                    velocities[i].y -= 9.8 * 0.016; // Gravity
                }
                particles.geometry.attributes.position.needsUpdate = true;

                // Fade out
                material.opacity = 1 - (elapsed / duration);
                flash.intensity = 10 * (1 - elapsed / duration);

                if (elapsed < duration) {
                    requestAnimationFrame(animate);
                } else {
                    // Cleanup
                    this.app.scene.remove(particles);
                    this.app.scene.remove(flash);
                    geometry.dispose();
                    material.dispose();
                    resolve();
                }
            };

            animate();
        });
    }

    toggleSpeedBoost() {
        this.speedBoostActive = !this.speedBoostActive;

        if (this.app.activeVehicle) {
            if (this.speedBoostActive) {
                this.app.activeVehicle.maxSpeed *= 2;
                this.app.activeVehicle.acceleration *= 1.5;
                this.showMessage('Speed Boost ACTIVATED!');
            } else {
                this.app.activeVehicle.maxSpeed /= 2;
                this.app.activeVehicle.acceleration /= 1.5;
                this.showMessage('Speed Boost deactivated');
            }
        }
    }

    toggleNightMode() {
        if (this.app.toggleNightMode) {
            this.app.toggleNightMode();
            this.showMessage(this.app.isNightMode ? 'Night Mode ON' : 'Day Mode ON');
        }
    }

    toggleFlyMode() {
        this.flyModeActive = !this.flyModeActive;
        this.showMessage(this.flyModeActive ? 'Fly Mode ACTIVATED!' : 'Fly Mode deactivated');
        // Fly mode implementation would require physics changes
    }

    showMessage(text) {
        // Create or update message display
        let messageEl = document.getElementById('cheat-message');

        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'cheat-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: #ffff00;
                padding: 20px 40px;
                border-radius: 10px;
                font-family: 'Courier New', monospace;
                font-size: 24px;
                font-weight: bold;
                z-index: 10000;
                text-align: center;
                border: 2px solid #ffff00;
                box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }

        messageEl.textContent = text;
        messageEl.style.opacity = '1';

        // Hide after delay
        setTimeout(() => {
            messageEl.style.opacity = '0';
        }, 2000);
    }

    destroy() {
        // Remove message element if exists
        const messageEl = document.getElementById('cheat-message');
        if (messageEl) {
            messageEl.remove();
        }
    }
}
