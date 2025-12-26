import * as THREE from 'three';

export class Motorcycle {
    constructor(scene, world, isNightMode = false) {
        this.scene = scene;
        this.world = world;
        this.isNightMode = isNightMode;

        this.mesh = null;
        this.body = null;

        this.frontWheel = null;
        this.rearWheel = null;

        this.speed = 0;
        this.maxSpeed = 80;
        this.acceleration = 35;
        this.brakeForce = 50;
        this.turnSpeed = 2.5;
        this.friction = 0.98;

        this.wheelRotation = 0;
        this.steerAngle = 0;
        this.leanAngle = 0;

        // Start on the ground
        this.position = new THREE.Vector3(0, 0, 5);
        this.rotation = 0;

        // Store obstacles for collision checking
        this.obstacles = [];
    }

    async create() {
        // Create Yezdi-style classic motorcycle
        this.mesh = new THREE.Group();

        // Materials - Jawa Cruiser style (sleek black with chrome)
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a, // Glossy black - Jawa signature
            metalness: 0.9,
            roughness: 0.2
        });

        const chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            metalness: 1,
            roughness: 0.05
        });

        const blackMaterial = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            metalness: 0.4,
            roughness: 0.6
        });

        const tireMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.1,
            roughness: 0.9
        });

        const seatMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513, // Tan brown leather - Jawa signature
            metalness: 0.1,
            roughness: 0.7
        });

        // Gold pinstripe material (Jawa signature detail)
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.8,
            roughness: 0.3
        });

        // Classic teardrop fuel tank (Yezdi signature)
        const tankShape = new THREE.Shape();
        tankShape.moveTo(0, 0);
        tankShape.quadraticCurveTo(0.5, 0.3, 0.6, 0);
        tankShape.quadraticCurveTo(0.5, -0.3, 0, 0);

        const tankGeometry = new THREE.CapsuleGeometry(0.28, 1.0, 12, 24);
        const tank = new THREE.Mesh(tankGeometry, bodyMaterial);
        tank.rotation.z = Math.PI / 2;
        tank.rotation.y = Math.PI / 12; // Slight angle
        tank.position.set(0, 0.85, 0.1);
        tank.scale.set(1, 0.8, 1);
        tank.castShadow = true;
        this.mesh.add(tank);

        // Tank stripe (gold pinstripe - Jawa signature)
        const stripeGeometry = new THREE.BoxGeometry(0.85, 0.015, 0.06);
        const stripe = new THREE.Mesh(stripeGeometry, goldMaterial);
        stripe.position.set(0, 1.0, 0.1);
        this.mesh.add(stripe);

        // Additional gold pinstripes on sides
        const sideStripeGeometry = new THREE.BoxGeometry(0.6, 0.01, 0.01);
        const leftStripe = new THREE.Mesh(sideStripeGeometry, goldMaterial);
        leftStripe.position.set(0, 0.9, 0.28);
        this.mesh.add(leftStripe);
        const rightStripe = new THREE.Mesh(sideStripeGeometry, goldMaterial);
        rightStripe.position.set(0, 0.9, -0.08);
        this.mesh.add(rightStripe);

        // Fuel cap
        const capGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
        const cap = new THREE.Mesh(capGeometry, chromeMaterial);
        cap.position.set(0, 1.13, 0.1);
        this.mesh.add(cap);

        // Engine block (classic air-cooled look)
        const engineGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.45);
        const engine = new THREE.Mesh(engineGeometry, blackMaterial);
        engine.position.set(0, 0.4, 0);
        engine.castShadow = true;
        this.mesh.add(engine);

        // Engine cooling fins
        for (let i = 0; i < 5; i++) {
            const finGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.5);
            const fin = new THREE.Mesh(finGeometry, blackMaterial);
            fin.position.set(0, 0.28 + i * 0.06, 0);
            this.mesh.add(fin);
        }

        // Cylinder head
        const cylinderGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2, 12);
        const cylinder = new THREE.Mesh(cylinderGeometry, blackMaterial);
        cylinder.rotation.z = Math.PI / 3;
        cylinder.position.set(0.2, 0.5, 0);
        cylinder.castShadow = true;
        this.mesh.add(cylinder);

        // Classic twin exhaust pipes (Yezdi signature)
        const exhaustCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0.15, 0.3, 0),
            new THREE.Vector3(0.25, 0.2, -0.2),
            new THREE.Vector3(0.2, 0.2, -0.6),
            new THREE.Vector3(0.25, 0.25, -0.9)
        ]);
        const exhaustGeometry = new THREE.TubeGeometry(exhaustCurve, 20, 0.04, 8, false);
        const exhaust1 = new THREE.Mesh(exhaustGeometry, chromeMaterial);
        exhaust1.castShadow = true;
        this.mesh.add(exhaust1);

        const exhaust2 = exhaust1.clone();
        exhaust2.scale.x = -1;
        this.mesh.add(exhaust2);

        // Exhaust tips (larger chrome ends)
        const tipGeometry = new THREE.CylinderGeometry(0.06, 0.05, 0.15, 12);
        const tip1 = new THREE.Mesh(tipGeometry, chromeMaterial);
        tip1.rotation.x = Math.PI / 2;
        tip1.position.set(0.25, 0.25, -0.95);
        this.mesh.add(tip1);

        const tip2 = tip1.clone();
        tip2.position.x = -0.25;
        this.mesh.add(tip2);

        // Classic long seat (saddle style)
        const seatGeometry = new THREE.BoxGeometry(0.32, 0.08, 0.8);
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set(0, 0.92, -0.3);
        seat.castShadow = true;
        this.mesh.add(seat);

        // Seat cushion (rounded top)
        const cushionGeometry = new THREE.CapsuleGeometry(0.12, 0.5, 8, 16);
        const cushion = new THREE.Mesh(cushionGeometry, seatMaterial);
        cushion.rotation.z = Math.PI / 2;
        cushion.position.set(0, 0.98, -0.3);
        this.mesh.add(cushion);

        // Create male rider
        this.createRider();

        // Frame tubes (classic steel frame)
        const frameMaterial = blackMaterial;

        // Main frame tube
        const mainFrameGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8);
        const mainFrame = new THREE.Mesh(mainFrameGeometry, frameMaterial);
        mainFrame.rotation.x = Math.PI / 2;
        mainFrame.position.set(0, 0.5, 0);
        this.mesh.add(mainFrame);

        // Down tube
        const downTubeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
        const downTube = new THREE.Mesh(downTubeGeometry, frameMaterial);
        downTube.rotation.x = Math.PI / 6;
        downTube.position.set(0, 0.35, 0.4);
        this.mesh.add(downTube);

        // Rear swing arm
        const swingArmGeometry = new THREE.BoxGeometry(0.06, 0.06, 0.7);
        const swingArm1 = new THREE.Mesh(swingArmGeometry, frameMaterial);
        swingArm1.position.set(0.12, 0.25, -0.4);
        this.mesh.add(swingArm1);

        const swingArm2 = swingArm1.clone();
        swingArm2.position.x = -0.12;
        this.mesh.add(swingArm2);

        // Front forks (classic telescopic)
        this.frontWheelGroup = new THREE.Group();
        this.frontWheelGroup.position.set(0, 0.25, 0.8);
        this.mesh.add(this.frontWheelGroup);

        const forkGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.7, 8);
        const fork1 = new THREE.Mesh(forkGeometry, chromeMaterial);
        fork1.position.set(0.15, 0.35, 0);
        fork1.rotation.x = -0.15;
        this.frontWheelGroup.add(fork1);

        const fork2 = fork1.clone();
        fork2.position.x = -0.15;
        this.frontWheelGroup.add(fork2);

        // Fork sliders (lower chrome part)
        const sliderGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8);
        const slider1 = new THREE.Mesh(sliderGeometry, chromeMaterial);
        slider1.position.set(0.15, 0.05, 0);
        this.frontWheelGroup.add(slider1);

        const slider2 = slider1.clone();
        slider2.position.x = -0.15;
        this.frontWheelGroup.add(slider2);

        // Classic round headlight
        const headlightHousingGeometry = new THREE.SphereGeometry(0.15, 24, 24);
        const headlightHousing = new THREE.Mesh(headlightHousingGeometry, chromeMaterial);
        headlightHousing.position.set(0, 0.65, 0.15);
        headlightHousing.scale.z = 0.5;
        this.frontWheelGroup.add(headlightHousing);

        const headlightLensGeometry = new THREE.CircleGeometry(0.12, 24);
        const headlightLensMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: this.isNightMode ? 3 : 0.8,
            transparent: true,
            opacity: 0.9
        });
        const headlightLens = new THREE.Mesh(headlightLensGeometry, headlightLensMaterial);
        headlightLens.position.set(0, 0.65, 0.23);
        this.frontWheelGroup.add(headlightLens);

        // Headlight ring
        const ringGeometry = new THREE.TorusGeometry(0.13, 0.015, 8, 24);
        const ring = new THREE.Mesh(ringGeometry, chromeMaterial);
        ring.position.set(0, 0.65, 0.22);
        this.frontWheelGroup.add(ring);

        // Add spotlight for night mode
        if (this.isNightMode) {
            const spotlight = new THREE.SpotLight(0xffffcc, 15, 30, Math.PI / 6, 0.5);
            spotlight.position.set(0, 0.65, 0.3);
            spotlight.target.position.set(0, 0, 5);
            this.frontWheelGroup.add(spotlight);
            this.frontWheelGroup.add(spotlight.target);
        }

        // Classic handlebars (wide and flat)
        const handlebarGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 8);
        const handlebar = new THREE.Mesh(handlebarGeometry, chromeMaterial);
        handlebar.rotation.z = Math.PI / 2;
        handlebar.position.set(0, 0.95, 0.05);
        this.frontWheelGroup.add(handlebar);

        // Handlebar grips
        const gripGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8);
        const gripMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
        const grip1 = new THREE.Mesh(gripGeometry, gripMaterial);
        grip1.rotation.z = Math.PI / 2;
        grip1.position.set(0.38, 0.95, 0.05);
        this.frontWheelGroup.add(grip1);

        const grip2 = grip1.clone();
        grip2.position.x = -0.38;
        this.frontWheelGroup.add(grip2);

        // Mirrors (classic round)
        const mirrorGeometry = new THREE.CircleGeometry(0.05, 16);
        const mirrorMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            metalness: 0.9,
            roughness: 0.1
        });

        const mirrorStem1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.15, 8), chromeMaterial);
        mirrorStem1.position.set(0.35, 1.05, 0.05);
        mirrorStem1.rotation.z = -0.3;
        this.frontWheelGroup.add(mirrorStem1);

        const mirror1 = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
        mirror1.position.set(0.4, 1.12, 0.05);
        mirror1.rotation.y = Math.PI;
        this.frontWheelGroup.add(mirror1);

        const mirrorStem2 = mirrorStem1.clone();
        mirrorStem2.position.x = -0.35;
        mirrorStem2.rotation.z = 0.3;
        this.frontWheelGroup.add(mirrorStem2);

        const mirror2 = mirror1.clone();
        mirror2.position.x = -0.4;
        this.frontWheelGroup.add(mirror2);

        // Taillight
        const taillightGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: this.isNightMode ? 2 : 0.5
        });
        const taillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillight.position.set(0, 0.85, -0.75);
        taillight.scale.z = 0.5;
        this.mesh.add(taillight);

        // Taillight glow at night
        if (this.isNightMode) {
            const taillightGlow = new THREE.PointLight(0xff0000, 2, 5);
            taillightGlow.position.set(0, 0.85, -0.8);
            this.mesh.add(taillightGlow);
        }

        // Rear fender
        const fenderGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.25, 24, 1, false, 0, Math.PI);
        const fender = new THREE.Mesh(fenderGeometry, bodyMaterial);
        fender.rotation.z = Math.PI / 2;
        fender.rotation.y = Math.PI / 2;
        fender.position.set(0, 0.45, -0.6);
        this.mesh.add(fender);

        // Front fender
        const frontFenderGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 24, 1, false, 0, Math.PI);
        const frontFender = new THREE.Mesh(frontFenderGeometry, bodyMaterial);
        frontFender.rotation.z = Math.PI / 2;
        frontFender.rotation.y = Math.PI / 2;
        frontFender.position.set(0, 0.45, 0);
        this.frontWheelGroup.add(frontFender);

        // Create classic spoke wheels
        this.frontWheel = this.createClassicWheel(tireMaterial, chromeMaterial);
        this.frontWheelGroup.add(this.frontWheel);

        this.rearWheel = this.createClassicWheel(tireMaterial, chromeMaterial);
        this.rearWheel.position.set(0, 0.25, -0.65);
        this.mesh.add(this.rearWheel);

        // Kickstand
        const kickstandGeometry = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 8);
        const kickstand = new THREE.Mesh(kickstandGeometry, blackMaterial);
        kickstand.rotation.z = 0.5;
        kickstand.rotation.x = 0.2;
        kickstand.position.set(-0.2, 0.15, -0.1);
        this.mesh.add(kickstand);

        // Add to scene
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    createClassicWheel(tireMaterial, chromeMaterial) {
        const wheelGroup = new THREE.Group();

        // Tire
        const tireGeometry = new THREE.TorusGeometry(0.28, 0.08, 16, 32);
        const tire = new THREE.Mesh(tireGeometry, tireMaterial);
        tire.rotation.y = Math.PI / 2;
        tire.castShadow = true;
        wheelGroup.add(tire);

        // Chrome rim
        const rimGeometry = new THREE.TorusGeometry(0.22, 0.02, 8, 32);
        const rim = new THREE.Mesh(rimGeometry, chromeMaterial);
        rim.rotation.y = Math.PI / 2;
        wheelGroup.add(rim);

        // Hub
        const hubGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 16);
        const hub = new THREE.Mesh(hubGeometry, chromeMaterial);
        hub.rotation.z = Math.PI / 2;
        wheelGroup.add(hub);

        // Classic spokes (36 spokes like real Yezdi)
        const spokeGeometry = new THREE.CylinderGeometry(0.004, 0.004, 0.2, 4);
        for (let i = 0; i < 18; i++) {
            const angle = (i / 18) * Math.PI * 2;

            // Left side spokes
            const spoke1 = new THREE.Mesh(spokeGeometry, chromeMaterial);
            spoke1.rotation.z = Math.PI / 2;
            spoke1.rotation.x = angle;
            spoke1.position.x = 0.03;
            spoke1.position.y = Math.sin(angle) * 0.12;
            spoke1.position.z = Math.cos(angle) * 0.12;
            wheelGroup.add(spoke1);

            // Right side spokes
            const spoke2 = new THREE.Mesh(spokeGeometry, chromeMaterial);
            spoke2.rotation.z = Math.PI / 2;
            spoke2.rotation.x = angle + Math.PI / 18;
            spoke2.position.x = -0.03;
            spoke2.position.y = Math.sin(angle + Math.PI / 18) * 0.12;
            spoke2.position.z = Math.cos(angle + Math.PI / 18) * 0.12;
            wheelGroup.add(spoke2);
        }

        return wheelGroup;
    }

    createRider() {
        this.rider = new THREE.Group();

        // Skin color
        const skinColor = 0xf1c27d;
        const skinMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });

        // Jacket (black leather biker jacket)
        const jacketMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });

        // Jeans
        const jeansMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.8 });

        // Helmet (black with visor)
        const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3, metalness: 0.5 });
        const visorMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.8
        });

        // Torso (leaning forward riding position)
        const torsoGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 8);
        const torso = new THREE.Mesh(torsoGeometry, jacketMaterial);
        torso.position.set(0, 1.45, -0.25);
        torso.rotation.x = 0.4; // Lean forward
        torso.castShadow = true;
        this.rider.add(torso);

        // Helmet
        const helmetGeometry = new THREE.SphereGeometry(0.18, 16, 16);
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.set(0, 1.85, -0.05);
        helmet.scale.set(1, 1.1, 1.2);
        helmet.castShadow = true;
        this.rider.add(helmet);

        // Visor
        const visorGeometry = new THREE.SphereGeometry(0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const visor = new THREE.Mesh(visorGeometry, visorMaterial);
        visor.position.set(0, 1.82, 0.05);
        visor.rotation.x = -0.3;
        this.rider.add(visor);

        // Upper legs (thighs on seat)
        const thighGeometry = new THREE.CylinderGeometry(0.09, 0.08, 0.4, 8);

        const leftThigh = new THREE.Mesh(thighGeometry, jeansMaterial);
        leftThigh.position.set(0.12, 1.1, -0.25);
        leftThigh.rotation.x = Math.PI / 2 - 0.3;
        leftThigh.rotation.z = 0.2;
        leftThigh.castShadow = true;
        this.rider.add(leftThigh);

        const rightThigh = new THREE.Mesh(thighGeometry, jeansMaterial);
        rightThigh.position.set(-0.12, 1.1, -0.25);
        rightThigh.rotation.x = Math.PI / 2 - 0.3;
        rightThigh.rotation.z = -0.2;
        rightThigh.castShadow = true;
        this.rider.add(rightThigh);

        // Lower legs (bent at knee, feet on pegs)
        const lowerLegGeometry = new THREE.CylinderGeometry(0.07, 0.06, 0.35, 8);

        const leftLowerLeg = new THREE.Mesh(lowerLegGeometry, jeansMaterial);
        leftLowerLeg.position.set(0.18, 0.75, -0.1);
        leftLowerLeg.rotation.z = 0.3;
        leftLowerLeg.castShadow = true;
        this.rider.add(leftLowerLeg);

        const rightLowerLeg = new THREE.Mesh(lowerLegGeometry, jeansMaterial);
        rightLowerLeg.position.set(-0.18, 0.75, -0.1);
        rightLowerLeg.rotation.z = -0.3;
        rightLowerLeg.castShadow = true;
        this.rider.add(rightLowerLeg);

        // Boots
        const bootMaterial = new THREE.MeshStandardMaterial({ color: 0x2d2d2d, roughness: 0.6 });
        const bootGeometry = new THREE.BoxGeometry(0.1, 0.08, 0.18);

        const leftBoot = new THREE.Mesh(bootGeometry, bootMaterial);
        leftBoot.position.set(0.22, 0.55, 0);
        this.rider.add(leftBoot);

        const rightBoot = new THREE.Mesh(bootGeometry, bootMaterial);
        rightBoot.position.set(-0.22, 0.55, 0);
        this.rider.add(rightBoot);

        // Arms (holding handlebars)
        const upperArmGeometry = new THREE.CylinderGeometry(0.055, 0.05, 0.3, 8);
        const forearmGeometry = new THREE.CylinderGeometry(0.05, 0.045, 0.28, 8);

        // Left arm
        const leftUpperArm = new THREE.Mesh(upperArmGeometry, jacketMaterial);
        leftUpperArm.position.set(0.25, 1.55, -0.1);
        leftUpperArm.rotation.z = 0.8;
        leftUpperArm.rotation.x = 0.3;
        leftUpperArm.castShadow = true;
        this.rider.add(leftUpperArm);

        const leftForearm = new THREE.Mesh(forearmGeometry, jacketMaterial);
        leftForearm.position.set(0.38, 1.35, 0.15);
        leftForearm.rotation.x = -0.8;
        leftForearm.rotation.z = 0.3;
        leftForearm.castShadow = true;
        this.rider.add(leftForearm);

        // Right arm
        const rightUpperArm = new THREE.Mesh(upperArmGeometry, jacketMaterial);
        rightUpperArm.position.set(-0.25, 1.55, -0.1);
        rightUpperArm.rotation.z = -0.8;
        rightUpperArm.rotation.x = 0.3;
        rightUpperArm.castShadow = true;
        this.rider.add(rightUpperArm);

        const rightForearm = new THREE.Mesh(forearmGeometry, jacketMaterial);
        rightForearm.position.set(-0.38, 1.35, 0.15);
        rightForearm.rotation.x = -0.8;
        rightForearm.rotation.z = -0.3;
        rightForearm.castShadow = true;
        this.rider.add(rightForearm);

        // Gloves (hands on handlebars)
        const gloveMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 });
        const gloveGeometry = new THREE.SphereGeometry(0.05, 8, 8);

        const leftGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
        leftGlove.position.set(0.38, 1.15, 0.35);
        this.rider.add(leftGlove);

        const rightGlove = new THREE.Mesh(gloveGeometry, gloveMaterial);
        rightGlove.position.set(-0.38, 1.15, 0.35);
        this.rider.add(rightGlove);

        this.mesh.add(this.rider);
    }

    // Register obstacles for collision detection
    addObstacle(x, z, width, depth) {
        this.obstacles.push({ x, z, width, depth });
    }

    // Check collision with obstacles
    checkCollisions(newX, newZ) {
        const bikeRadius = 0.8;

        for (const obs of this.obstacles) {
            const halfWidth = obs.width / 2 + bikeRadius;
            const halfDepth = obs.depth / 2 + bikeRadius;

            if (Math.abs(newX - obs.x) < halfWidth && Math.abs(newZ - obs.z) < halfDepth) {
                return true;
            }
        }
        return false;
    }

    update(delta, input) {
        const { forward, backward, left, right, brake } = input;

        // Acceleration
        if (forward) {
            this.speed += this.acceleration * delta;
        } else if (backward) {
            this.speed -= this.acceleration * 0.5 * delta;
        }

        // Braking
        if (brake) {
            this.speed *= 0.95;
        }

        // Apply friction
        this.speed *= this.friction;

        // Clamp speed
        this.speed = THREE.MathUtils.clamp(this.speed, -this.maxSpeed / 2, this.maxSpeed);

        // Steering - only when moving
        if (Math.abs(this.speed) > 0.5) {
            const turnAmount = this.turnSpeed * delta * (this.speed > 0 ? 1 : -1);
            if (left) {
                this.rotation += turnAmount;
                this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0.4, delta * 5);
            } else if (right) {
                this.rotation -= turnAmount;
                this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, -0.4, delta * 5);
            } else {
                this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 5);
            }
        } else {
            this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, 0, delta * 5);
        }

        // Calculate lean based on turning and speed
        const targetLean = -this.steerAngle * Math.min(Math.abs(this.speed) / 30, 1) * 0.5;
        this.leanAngle = THREE.MathUtils.lerp(this.leanAngle, targetLean, delta * 5);

        // Calculate new position
        const moveX = Math.sin(this.rotation) * this.speed * delta;
        const moveZ = Math.cos(this.rotation) * this.speed * delta;

        const newX = this.position.x + moveX;
        const newZ = this.position.z + moveZ;

        // Check for collisions before moving
        if (!this.checkCollisions(newX, newZ)) {
            this.position.x = newX;
            this.position.z = newZ;
        } else {
            this.speed *= -0.3;

            if (!this.checkCollisions(newX, this.position.z)) {
                this.position.x = newX;
            } else if (!this.checkCollisions(this.position.x, newZ)) {
                this.position.z = newZ;
            }
        }

        // Keep motorcycle on ground
        this.position.y = 0;

        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        this.mesh.rotation.z = this.leanAngle;

        // Rotate wheels
        this.wheelRotation += this.speed * delta * 0.3;
        this.frontWheel.rotation.x = this.wheelRotation;
        this.rearWheel.rotation.x = this.wheelRotation;

        // Steer front wheel
        this.frontWheelGroup.rotation.y = this.steerAngle;
    }

    getPosition() {
        return this.position;
    }

    getRotation() {
        return this.rotation;
    }

    getSpeed() {
        return this.speed;
    }

    isMoving() {
        return Math.abs(this.speed) > 1;
    }

    reset() {
        this.position.set(0, 0, 5);
        this.rotation = 0;
        this.speed = 0;
        this.leanAngle = 0;
        this.steerAngle = 0;
    }
}
