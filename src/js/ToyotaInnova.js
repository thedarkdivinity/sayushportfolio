import * as THREE from 'three';
import { PlayerVehicle } from './PlayerVehicle.js';

/**
 * ToyotaInnova - Procedural 2004-2015 Toyota Innova MPV
 * Vintage style with tall roof, chrome grille, and distinctive MPV shape
 */
export class ToyotaInnova extends PlayerVehicle {
    constructor(scene, world, isNightMode = false) {
        super(scene, world, isNightMode);

        // Car-specific dimensions (scaled for game)
        this.dimensions = {
            length: 4.5,
            width: 1.8,
            height: 1.8,
            wheelbase: 2.75
        };

        // Car physics (different from motorcycle)
        this.maxSpeed = 100;
        this.acceleration = 25;
        this.brakeForce = 40;
        this.turnSpeed = 1.8; // Wider turning radius than bike
        this.friction = 0.97;
        this.collisionRadius = 1.2;

        // Car-specific properties
        this.steerAngle = 0;
        this.wheelRotation = 0;
        this.wheels = [];
        this.frontWheels = [];

        // Lights
        this.headlights = [];
        this.taillights = [];
        this.brakeLightsOn = false;
    }

    async create() {
        this.mesh = new THREE.Group();

        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5f5, // Classic white/silver - popular Innova color
            metalness: 0.7,
            roughness: 0.3
        });

        const chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            metalness: 1,
            roughness: 0.05
        });

        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a3a5c,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.6
        });

        const blackPlasticMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.8
        });

        const tireMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.1,
            roughness: 0.9
        });

        const interiorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.1,
            roughness: 0.8
        });

        // ===== MAIN BODY =====

        // Lower body (main car body)
        const lowerBodyGeometry = new THREE.BoxGeometry(4.2, 0.6, 1.7);
        const lowerBody = new THREE.Mesh(lowerBodyGeometry, bodyMaterial);
        lowerBody.position.set(0, 0.5, 0);
        lowerBody.castShadow = true;
        this.mesh.add(lowerBody);

        // Upper body / Cabin (tall MPV shape)
        const cabinGeometry = new THREE.BoxGeometry(3.2, 0.9, 1.65);
        const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
        cabin.position.set(-0.3, 1.15, 0);
        cabin.castShadow = true;
        this.mesh.add(cabin);

        // Roof
        const roofGeometry = new THREE.BoxGeometry(2.8, 0.1, 1.5);
        const roof = new THREE.Mesh(roofGeometry, bodyMaterial);
        roof.position.set(-0.3, 1.65, 0);
        roof.castShadow = true;
        this.mesh.add(roof);

        // Roof rails (chrome)
        const railGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8);
        const leftRail = new THREE.Mesh(railGeometry, chromeMaterial);
        leftRail.rotation.z = Math.PI / 2;
        leftRail.position.set(-0.3, 1.72, 0.7);
        this.mesh.add(leftRail);

        const rightRail = leftRail.clone();
        rightRail.position.z = -0.7;
        this.mesh.add(rightRail);

        // ===== FRONT END =====

        // Hood (sloped)
        const hoodGeometry = new THREE.BoxGeometry(1.0, 0.15, 1.6);
        const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
        hood.position.set(1.5, 0.85, 0);
        hood.rotation.z = -0.1;
        hood.castShadow = true;
        this.mesh.add(hood);

        // Front bumper
        const frontBumperGeometry = new THREE.BoxGeometry(0.2, 0.3, 1.75);
        const frontBumper = new THREE.Mesh(frontBumperGeometry, blackPlasticMaterial);
        frontBumper.position.set(2.1, 0.35, 0);
        this.mesh.add(frontBumper);

        // Chrome grille (Toyota Innova signature - horizontal bars)
        this.createGrille(chromeMaterial);

        // Headlights (large rectangular - Innova style)
        this.createHeadlights();

        // ===== REAR END =====

        // Rear panel
        const rearPanelGeometry = new THREE.BoxGeometry(0.15, 1.2, 1.6);
        const rearPanel = new THREE.Mesh(rearPanelGeometry, bodyMaterial);
        rearPanel.position.set(-2.0, 0.9, 0);
        rearPanel.castShadow = true;
        this.mesh.add(rearPanel);

        // Rear bumper
        const rearBumperGeometry = new THREE.BoxGeometry(0.15, 0.25, 1.7);
        const rearBumper = new THREE.Mesh(rearBumperGeometry, blackPlasticMaterial);
        rearBumper.position.set(-2.15, 0.32, 0);
        this.mesh.add(rearBumper);

        // Taillights
        this.createTaillights();

        // ===== WINDOWS =====

        // Windshield (angled)
        const windshieldGeometry = new THREE.BoxGeometry(0.08, 0.75, 1.5);
        const windshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
        windshield.position.set(1.0, 1.1, 0);
        windshield.rotation.z = 0.25;
        this.mesh.add(windshield);

        // Rear window
        const rearWindowGeometry = new THREE.BoxGeometry(0.08, 0.65, 1.4);
        const rearWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
        rearWindow.position.set(-1.7, 1.15, 0);
        rearWindow.rotation.z = -0.15;
        this.mesh.add(rearWindow);

        // Side windows (3 per side for MPV)
        this.createSideWindows(glassMaterial);

        // ===== DOORS =====

        // Door lines
        this.createDoorLines(blackPlasticMaterial);

        // Side mirrors
        this.createMirrors(bodyMaterial, glassMaterial);

        // ===== WHEELS =====
        this.createWheels(tireMaterial, chromeMaterial);

        // ===== DETAILS =====

        // Door handles (chrome)
        this.createDoorHandles(chromeMaterial);

        // License plate area
        const plateGeometry = new THREE.BoxGeometry(0.02, 0.2, 0.5);
        const plateMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const frontPlate = new THREE.Mesh(plateGeometry, plateMaterial);
        frontPlate.position.set(2.12, 0.4, 0);
        this.mesh.add(frontPlate);

        const rearPlate = frontPlate.clone();
        rearPlate.position.set(-2.15, 0.5, 0);
        this.mesh.add(rearPlate);

        // Toyota emblem on grille (simplified circle)
        const emblemGeometry = new THREE.CircleGeometry(0.12, 16);
        const emblemMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc0000,
            metalness: 0.5,
            roughness: 0.3
        });
        const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
        emblem.position.set(2.06, 0.7, 0);
        emblem.rotation.y = Math.PI / 2;
        this.mesh.add(emblem);

        // Position and add to scene
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    createGrille(chromeMaterial) {
        // Main grille frame
        const frameGeometry = new THREE.BoxGeometry(0.08, 0.4, 1.2);
        const frame = new THREE.Mesh(frameGeometry, chromeMaterial);
        frame.position.set(2.05, 0.7, 0);
        this.mesh.add(frame);

        // Horizontal chrome bars (5 bars - Innova signature)
        for (let i = 0; i < 5; i++) {
            const barGeometry = new THREE.BoxGeometry(0.05, 0.03, 1.1);
            const bar = new THREE.Mesh(barGeometry, chromeMaterial);
            bar.position.set(2.08, 0.55 + i * 0.08, 0);
            this.mesh.add(bar);
        }

        // Lower grille (black mesh area)
        const lowerGrilleGeometry = new THREE.BoxGeometry(0.05, 0.15, 1.0);
        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.3,
            roughness: 0.7
        });
        const lowerGrille = new THREE.Mesh(lowerGrilleGeometry, blackMaterial);
        lowerGrille.position.set(2.08, 0.38, 0);
        this.mesh.add(lowerGrille);
    }

    createHeadlights() {
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffee,
            emissive: 0xffffee,
            emissiveIntensity: this.isNightMode ? 2 : 0.5,
            transparent: true,
            opacity: 0.9
        });

        // Large rectangular headlights (Innova style)
        const headlightGeometry = new THREE.BoxGeometry(0.15, 0.2, 0.35);

        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial.clone());
        leftHeadlight.position.set(2.0, 0.7, 0.6);
        this.mesh.add(leftHeadlight);
        this.headlights.push(leftHeadlight);

        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial.clone());
        rightHeadlight.position.set(2.0, 0.7, -0.6);
        this.mesh.add(rightHeadlight);
        this.headlights.push(rightHeadlight);

        // Headlight chrome bezels
        const bezelMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });
        const bezelGeometry = new THREE.BoxGeometry(0.05, 0.25, 0.4);

        const leftBezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
        leftBezel.position.set(2.1, 0.7, 0.6);
        this.mesh.add(leftBezel);

        const rightBezel = leftBezel.clone();
        rightBezel.position.z = -0.6;
        this.mesh.add(rightBezel);

        // Add spotlights for night mode
        if (this.isNightMode) {
            const spotlight = new THREE.SpotLight(0xffffcc, 10, 40, Math.PI / 5, 0.5);
            spotlight.position.set(2.2, 0.7, 0);
            spotlight.target.position.set(10, 0, 0);
            this.mesh.add(spotlight);
            this.mesh.add(spotlight.target);
        }
    }

    createTaillights() {
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: this.isNightMode ? 1.5 : 0.3
        });

        // Vertical taillights (Innova style)
        const taillightGeometry = new THREE.BoxGeometry(0.08, 0.4, 0.2);

        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial.clone());
        leftTaillight.position.set(-2.05, 0.9, 0.65);
        this.mesh.add(leftTaillight);
        this.taillights.push(leftTaillight);

        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial.clone());
        rightTaillight.position.set(-2.05, 0.9, -0.65);
        this.mesh.add(rightTaillight);
        this.taillights.push(rightTaillight);

        // Add brake light glow for night mode
        if (this.isNightMode) {
            const brakeGlow = new THREE.PointLight(0xff0000, 1, 5);
            brakeGlow.position.set(-2.2, 0.9, 0);
            this.mesh.add(brakeGlow);
        }
    }

    createSideWindows(glassMaterial) {
        // Front side windows
        const frontWindowGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.05);

        const frontLeftWindow = new THREE.Mesh(frontWindowGeometry, glassMaterial);
        frontLeftWindow.position.set(0.5, 1.1, 0.83);
        this.mesh.add(frontLeftWindow);

        const frontRightWindow = frontLeftWindow.clone();
        frontRightWindow.position.z = -0.83;
        this.mesh.add(frontRightWindow);

        // Middle windows
        const midWindowGeometry = new THREE.BoxGeometry(0.7, 0.5, 0.05);

        const midLeftWindow = new THREE.Mesh(midWindowGeometry, glassMaterial);
        midLeftWindow.position.set(-0.25, 1.1, 0.83);
        this.mesh.add(midLeftWindow);

        const midRightWindow = midLeftWindow.clone();
        midRightWindow.position.z = -0.83;
        this.mesh.add(midRightWindow);

        // Rear quarter windows
        const rearWindowGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.05);

        const rearLeftWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
        rearLeftWindow.position.set(-1.0, 1.1, 0.83);
        this.mesh.add(rearLeftWindow);

        const rearRightWindow = rearLeftWindow.clone();
        rearRightWindow.position.z = -0.83;
        this.mesh.add(rearRightWindow);
    }

    createDoorLines(material) {
        const lineGeometry = new THREE.BoxGeometry(0.02, 0.8, 0.03);

        // Front door lines
        const frontDoorLine = new THREE.Mesh(lineGeometry, material);
        frontDoorLine.position.set(0.1, 0.8, 0.85);
        this.mesh.add(frontDoorLine);

        const frontDoorLineR = frontDoorLine.clone();
        frontDoorLineR.position.z = -0.85;
        this.mesh.add(frontDoorLineR);

        // Rear door lines (sliding door indicator on left side)
        const rearDoorLine = new THREE.Mesh(lineGeometry, material);
        rearDoorLine.position.set(-0.6, 0.8, 0.85);
        this.mesh.add(rearDoorLine);

        const rearDoorLineR = rearDoorLine.clone();
        rearDoorLineR.position.z = -0.85;
        this.mesh.add(rearDoorLineR);

        // Sliding door track (left side - Innova signature)
        const trackGeometry = new THREE.BoxGeometry(1.0, 0.02, 0.03);
        const track = new THREE.Mesh(trackGeometry, material);
        track.position.set(-0.3, 0.65, 0.86);
        this.mesh.add(track);
    }

    createMirrors(bodyMaterial, glassMaterial) {
        // Mirror housing
        const housingGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.08);

        const leftMirror = new THREE.Mesh(housingGeometry, bodyMaterial);
        leftMirror.position.set(0.8, 1.0, 0.95);
        this.mesh.add(leftMirror);

        const rightMirror = leftMirror.clone();
        rightMirror.position.z = -0.95;
        this.mesh.add(rightMirror);

        // Mirror glass
        const glassGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.02);
        const leftGlass = new THREE.Mesh(glassGeometry, glassMaterial);
        leftGlass.position.set(0.8, 1.0, 1.0);
        this.mesh.add(leftGlass);

        const rightGlass = leftGlass.clone();
        rightGlass.position.z = -1.0;
        this.mesh.add(rightGlass);
    }

    createWheels(tireMaterial, chromeMaterial) {
        const wheelPositions = [
            { x: 1.3, y: 0.25, z: 0.8, front: true },
            { x: 1.3, y: 0.25, z: -0.8, front: true },
            { x: -1.3, y: 0.25, z: 0.8, front: false },
            { x: -1.3, y: 0.25, z: -0.8, front: false }
        ];

        wheelPositions.forEach(pos => {
            const wheelGroup = new THREE.Group();

            // Tire
            const tireGeometry = new THREE.TorusGeometry(0.3, 0.12, 16, 32);
            const tire = new THREE.Mesh(tireGeometry, tireMaterial);
            tire.rotation.y = Math.PI / 2;
            tire.castShadow = true;
            wheelGroup.add(tire);

            // Wheel rim (alloy style)
            const rimGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 16);
            const rim = new THREE.Mesh(rimGeometry, chromeMaterial);
            rim.rotation.x = Math.PI / 2;
            wheelGroup.add(rim);

            // Hub cap
            const hubGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.16, 8);
            const hub = new THREE.Mesh(hubGeometry, chromeMaterial);
            hub.rotation.x = Math.PI / 2;
            wheelGroup.add(hub);

            // Spokes
            for (let i = 0; i < 5; i++) {
                const spokeGeometry = new THREE.BoxGeometry(0.18, 0.03, 0.02);
                const spoke = new THREE.Mesh(spokeGeometry, chromeMaterial);
                spoke.rotation.z = (i / 5) * Math.PI * 2;
                spoke.position.z = pos.z > 0 ? 0.07 : -0.07;
                wheelGroup.add(spoke);
            }

            wheelGroup.position.set(pos.x, pos.y, pos.z);
            this.mesh.add(wheelGroup);
            this.wheels.push(wheelGroup);

            if (pos.front) {
                this.frontWheels.push(wheelGroup);
            }
        });
    }

    createDoorHandles(chromeMaterial) {
        const handleGeometry = new THREE.BoxGeometry(0.12, 0.03, 0.02);

        const positions = [
            { x: 0.4, y: 0.85, z: 0.86 },   // Front left
            { x: 0.4, y: 0.85, z: -0.86 },  // Front right
            { x: -0.4, y: 0.85, z: 0.86 },  // Rear left (sliding)
            { x: -0.4, y: 0.85, z: -0.86 }  // Rear right
        ];

        positions.forEach(pos => {
            const handle = new THREE.Mesh(handleGeometry, chromeMaterial);
            handle.position.set(pos.x, pos.y, pos.z);
            this.mesh.add(handle);
        });
    }

    update(delta, input) {
        const { forward, backward, left, right, brake } = input;

        // Acceleration
        if (forward) {
            this.speed += this.acceleration * delta;
        } else if (backward) {
            this.speed -= this.acceleration * 0.4 * delta;
        }

        // Braking
        if (brake) {
            this.speed *= 0.94;
            this.brakeLightsOn = true;
        } else {
            this.brakeLightsOn = false;
        }

        // Apply friction
        this.speed *= this.friction;

        // Clamp speed
        this.speed = THREE.MathUtils.clamp(this.speed, -this.maxSpeed / 3, this.maxSpeed);

        // Steering (car has different steering feel than bike)
        if (Math.abs(this.speed) > 0.5) {
            const steerSensitivity = Math.min(1, 20 / Math.abs(this.speed)); // Less sensitive at high speed
            const turnAmount = this.turnSpeed * delta * steerSensitivity * (this.speed > 0 ? 1 : -1);

            if (left) {
                this.rotation += turnAmount;
                this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0.5, delta * 4);
            } else if (right) {
                this.rotation -= turnAmount;
                this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, -0.5, delta * 4);
            } else {
                this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 4);
            }
        } else {
            this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 4);
        }

        // Calculate new position
        const moveX = Math.sin(this.rotation) * this.speed * delta;
        const moveZ = Math.cos(this.rotation) * this.speed * delta;

        const newX = this.position.x + moveX;
        const newZ = this.position.z + moveZ;

        // Check for collisions
        if (!this.checkCollisions(newX, newZ)) {
            this.position.x = newX;
            this.position.z = newZ;
        } else {
            this.speed *= -0.2;
        }

        // Keep car on ground
        this.position.y = 0;

        // Update mesh position and rotation
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;

        // Rotate wheels
        this.wheelRotation += this.speed * delta * 0.4;
        this.wheels.forEach(wheel => {
            wheel.rotation.x = this.wheelRotation;
        });

        // Steer front wheels
        this.frontWheels.forEach(wheel => {
            wheel.rotation.y = this.steerAngle;
        });

        // Update brake lights
        this.taillights.forEach(light => {
            light.material.emissiveIntensity = this.brakeLightsOn ? 3 : (this.isNightMode ? 1 : 0.3);
        });
    }

    reset() {
        super.reset();
        this.steerAngle = 0;
        this.wheelRotation = 0;
        this.brakeLightsOn = false;
    }

    getType() {
        return 'car';
    }
}
