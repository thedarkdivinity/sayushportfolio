import * as THREE from 'three';
import { World } from './js/World.js';
import { Motorcycle } from './js/Motorcycle.js';
import { Controls } from './js/Controls.js';
import { Environment } from './js/Environment.js';
import { UI } from './js/UI.js';
import { Audio } from './js/Audio.js';
import { NPCManager } from './js/NPCManager.js';
import { CityRoadNetwork } from './js/CityRoadNetwork.js';
import { TrafficManager } from './js/TrafficManager.js';
import { CheatCodeManager } from './js/CheatCodeManager.js';

class App {
    constructor() {
        this.canvas = document.getElementById('webgl-canvas');
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingBar = document.querySelector('.loading-bar');
        this.loadingText = document.querySelector('.loading-text');

        this.clock = new THREE.Clock();
        this.progress = 0;

        // Determine if it's night time (6 PM to 6 AM)
        const hour = new Date().getHours();
        this.isNightMode = hour >= 18 || hour < 6;

        this.settings = {
            quality: 'medium',
            shadows: true,
            sfx: true,
            music: true,
            cameraShake: true
        };

        this.init();
    }

    async init() {
        this.updateLoading(10, 'Initializing renderer...');

        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: this.settings.quality !== 'low',
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.settings.quality === 'high' ? 2 : 1.5));
        this.renderer.shadowMap.enabled = this.settings.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        this.updateLoading(20, 'Creating scene...');

        // Setup scene with day/night colors
        this.scene = new THREE.Scene();

        if (this.isNightMode) {
            this.scene.background = new THREE.Color(0x111133);
            this.scene.fog = new THREE.Fog(0x111133, 100, 500);
            this.renderer.toneMappingExposure = 2.5;
        } else {
            this.scene.background = new THREE.Color(0x87ceeb);
            this.scene.fog = new THREE.Fog(0x87ceeb, 100, 400);
        }

        // Setup camera - position behind and above where motorcycle will spawn at (0, 0, 30)
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // Initial position: behind motorcycle at (0,0,30) facing +Z
        this.camera.position.set(0, 4, 22);
        this.camera.lookAt(0, 1, 30);
        this.cameraInitialized = false;

        this.updateLoading(30, 'Loading physics...');

        // Initialize physics world
        this.world = new World();
        await this.world.init();

        this.updateLoading(40, 'Building city roads...');

        // Create city road network
        this.roadNetwork = new CityRoadNetwork();

        this.updateLoading(50, 'Creating environment...');

        // Create environment with road network
        this.environment = new Environment(this.scene, this.world, this.isNightMode);
        await this.environment.create(this.roadNetwork);

        this.updateLoading(55, 'Setting up traffic...');

        // Create traffic manager
        this.trafficManager = new TrafficManager(this.scene, this.roadNetwork, this.isNightMode);
        this.trafficManager.createTrafficLights();

        this.updateLoading(60, 'Adding NPCs...');

        // Create NPCs with road network and traffic manager
        this.npcManager = new NPCManager(this.scene, this.isNightMode, this.roadNetwork, this.trafficManager);
        this.npcManager.create();

        this.updateLoading(70, 'Building motorcycle...');

        // Note: setPlayerVehicle() will be called after motorcycle is created

        // Create motorcycle
        this.motorcycle = new Motorcycle(this.scene, this.world, this.isNightMode);
        await this.motorcycle.create();

        // Set active vehicle (can be motorcycle or car after cheat)
        this.activeVehicle = this.motorcycle;

        // Set player vehicle reference for pedestrian collision detection
        this.npcManager.setPlayerVehicle(this.activeVehicle);

        // Register obstacles with vehicle for collision detection
        const obstacles = this.environment.getObstacles();
        obstacles.forEach(obs => {
            this.activeVehicle.addObstacle(obs.x, obs.z, obs.width, obs.depth);
        });

        this.updateLoading(85, 'Setting up controls...');

        // Setup controls
        this.controls = new Controls(this.activeVehicle);

        // Setup UI
        this.ui = new UI(this);

        this.updateLoading(90, 'Initializing cheat codes...');

        // Setup cheat code manager
        this.cheatManager = new CheatCodeManager(this);

        this.updateLoading(95, 'Loading audio...');

        // Setup audio
        this.audio = new Audio(this.settings);

        this.updateLoading(100, 'Ready!');

        // Hide loading screen
        setTimeout(() => {
            this.loadingScreen.classList.add('hidden');
            this.audio.playAmbient();
        }, 500);

        // Setup resize handler
        window.addEventListener('resize', () => this.onResize());

        // Start animation loop
        this.animate();
    }

    updateLoading(progress, text) {
        this.progress = progress;
        this.loadingBar.style.width = `${progress}%`;
        this.loadingText.textContent = text;
    }

    onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = Math.min(this.clock.getDelta(), 0.1);

        // Update physics
        this.world.update(delta);

        // Update traffic lights
        this.trafficManager.update(delta);

        // Get input
        const input = this.controls.getInput();

        // Update active vehicle (motorcycle or car)
        this.activeVehicle.update(delta, input);

        // Update engine sound
        this.audio.updateEngine(this.activeVehicle.getSpeed(), input.forward);

        // Update NPCs
        this.npcManager.update(delta);

        // Update camera to follow active vehicle
        this.updateCamera(delta);

        // Update UI
        this.ui.update(this.activeVehicle);

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    updateCamera(delta) {
        const vehiclePosition = this.activeVehicle.getPosition();
        const vehicleRotation = this.activeVehicle.getRotation();
        const speed = this.activeVehicle.getSpeed();

        // Adjust camera based on vehicle type
        const isCar = this.activeVehicle.getType() === 'car';
        const baseDistance = isCar ? 12 : 8;
        const baseHeight = isCar ? 4 : 3;

        // Camera offset based on speed
        const distance = baseDistance + Math.abs(speed) * 0.05;
        const height = baseHeight + Math.abs(speed) * 0.02;

        // Calculate target camera position
        const targetX = vehiclePosition.x - Math.sin(vehicleRotation) * distance;
        const targetY = vehiclePosition.y + height;
        const targetZ = vehiclePosition.z - Math.cos(vehicleRotation) * distance;

        // Snap camera on first frame, then smooth follow
        if (!this.cameraInitialized) {
            this.camera.position.set(targetX, targetY, targetZ);
            this.cameraInitialized = true;
        } else {
            // Smooth camera follow
            this.camera.position.x += (targetX - this.camera.position.x) * delta * 5;
            this.camera.position.y += (targetY - this.camera.position.y) * delta * 5;
            this.camera.position.z += (targetZ - this.camera.position.z) * delta * 5;
        }

        // Camera look at vehicle (look slightly down towards ground)
        const lookAtHeight = isCar ? 1.0 : 0.5;
        const lookAtTarget = new THREE.Vector3(
            vehiclePosition.x,
            lookAtHeight,
            vehiclePosition.z
        );

        // Add camera shake based on speed
        if (this.settings.cameraShake && Math.abs(speed) > 20) {
            const shakeIntensity = Math.abs(speed) * 0.001;
            lookAtTarget.x += (Math.random() - 0.5) * shakeIntensity;
            lookAtTarget.y += (Math.random() - 0.5) * shakeIntensity;
            lookAtTarget.z += (Math.random() - 0.5) * shakeIntensity;
        }

        this.camera.lookAt(lookAtTarget);
    }

    updateSettings(settings) {
        Object.assign(this.settings, settings);

        // Apply renderer settings
        if (settings.quality !== undefined) {
            this.renderer.setPixelRatio(
                Math.min(window.devicePixelRatio, settings.quality === 'high' ? 2 : settings.quality === 'medium' ? 1.5 : 1)
            );
        }

        if (settings.shadows !== undefined) {
            this.renderer.shadowMap.enabled = settings.shadows;
            // Update all shadow-casting objects
            this.scene.traverse((obj) => {
                if (obj.isMesh) {
                    obj.castShadow = settings.shadows;
                    obj.receiveShadow = settings.shadows;
                }
            });
        }

        if (settings.sfx !== undefined) {
            this.audio.setSfxEnabled(settings.sfx);
        }

        if (settings.music !== undefined) {
            this.audio.setMusicEnabled(settings.music);
        }
    }
}

// Start the app
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
