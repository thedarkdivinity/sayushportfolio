import * as THREE from 'three';

export class NPCManager {
    constructor(scene, isNightMode) {
        this.scene = scene;
        this.isNightMode = isNightMode;
        this.npcs = [];
        this.cars = [];
        this.pedestrians = [];
        this.carCollisionRadius = 2.5; // For collision detection between cars
    }

    create() {
        // Create NPC cars on the roads
        this.createCars();

        // Create detailed pedestrians near buildings
        this.createDetailedPedestrians();
    }

    createCars() {
        const carColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c];

        // Cars on the circular road
        const numCars = 6;
        for (let i = 0; i < numCars; i++) {
            const angle = (i / numCars) * Math.PI * 2;
            const radius = 40;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const car = this.createCar(carColors[i % carColors.length]);
            car.position.set(x, 0, z);
            car.rotation.y = angle + Math.PI / 2;

            // Store movement data
            car.userData = {
                type: 'car',
                angle: angle,
                radius: radius,
                speed: 0.2 + Math.random() * 0.3,
                direction: Math.random() > 0.5 ? 1 : -1
            };

            this.scene.add(car);
            this.cars.push(car);
        }

        // Cars on straight roads
        for (let i = 0; i < 4; i++) {
            const car = this.createCar(carColors[(i + 2) % carColors.length]);

            if (i < 2) {
                // Horizontal road
                car.position.set(-30 + i * 60, 0, 0);
                car.rotation.y = i === 0 ? 0 : Math.PI;
                car.userData = {
                    type: 'car',
                    axis: 'x',
                    speed: 0.3 + Math.random() * 0.2,
                    direction: i === 0 ? 1 : -1,
                    min: -40,
                    max: 40
                };
            } else {
                // Vertical road
                car.position.set(0, 0, -20 + (i - 2) * 40);
                car.rotation.y = i === 2 ? Math.PI / 2 : -Math.PI / 2;
                car.userData = {
                    type: 'car',
                    axis: 'z',
                    speed: 0.25 + Math.random() * 0.2,
                    direction: i === 2 ? 1 : -1,
                    min: -35,
                    max: 35
                };
            }

            this.scene.add(car);
            this.cars.push(car);
        }
    }

    createCar(color) {
        const car = new THREE.Group();

        // Car body
        const bodyGeometry = new THREE.BoxGeometry(1.8, 0.5, 0.9);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.6,
            roughness: 0.4
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        car.add(body);

        // Car cabin
        const cabinGeometry = new THREE.BoxGeometry(1, 0.4, 0.8);
        const cabinMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.2
        });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(-0.1, 0.75, 0);
        cabin.castShadow = true;
        car.add(cabin);

        // Windows
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });

        const windowGeometry = new THREE.PlaneGeometry(0.35, 0.3);
        const frontWindow = new THREE.Mesh(windowGeometry, windowMaterial);
        frontWindow.position.set(0.4, 0.75, 0);
        frontWindow.rotation.y = Math.PI / 2;
        car.add(frontWindow);

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.9
        });

        const wheelPositions = [
            { x: 0.5, z: 0.4 },
            { x: 0.5, z: -0.4 },
            { x: -0.5, z: 0.4 },
            { x: -0.5, z: -0.4 }
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(pos.x, 0.15, pos.z);
            wheel.castShadow = true;
            car.add(wheel);
        });

        // Headlights
        if (this.isNightMode) {
            const headlightGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const headlightMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffcc,
                emissive: 0xffffcc,
                emissiveIntensity: 1
            });

            const headlight1 = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight1.position.set(0.9, 0.4, 0.3);
            car.add(headlight1);

            const headlight2 = new THREE.Mesh(headlightGeometry, headlightMaterial);
            headlight2.position.set(0.9, 0.4, -0.3);
            car.add(headlight2);

            // Add point lights for headlights at night
            const light = new THREE.PointLight(0xffffcc, 0.5, 10);
            light.position.set(1.2, 0.4, 0);
            car.add(light);
        }

        // Taillights
        const taillightGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.15);
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: this.isNightMode ? 0.8 : 0.3
        });

        const taillight1 = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillight1.position.set(-0.92, 0.4, 0.3);
        car.add(taillight1);

        const taillight2 = new THREE.Mesh(taillightGeometry, taillightMaterial);
        taillight2.position.set(-0.92, 0.4, -0.3);
        car.add(taillight2);

        return car;
    }

    createDetailedPedestrians() {
        const pedestrianPositions = [
            { x: 15, z: 15, gender: 'male' },
            { x: -15, z: 15, gender: 'female' },
            { x: 15, z: -15, gender: 'female' },
            { x: -15, z: -15, gender: 'male' },
            { x: 50, z: 50, gender: 'male' },
            { x: -50, z: 50, gender: 'female' },
            { x: 50, z: -50, gender: 'male' },
            { x: -50, z: -50, gender: 'female' },
            { x: 25, z: 0, gender: 'male' },
            { x: -25, z: 0, gender: 'female' },
            { x: 0, z: 25, gender: 'female' },
            { x: 0, z: -25, gender: 'male' },
            { x: 30, z: 30, gender: 'female' },
            { x: -30, z: 30, gender: 'male' },
            { x: 30, z: -30, gender: 'male' },
            { x: -30, z: -30, gender: 'female' }
        ];

        const skinColors = [0xffdbac, 0xf1c27d, 0xe0ac69, 0xc68642, 0x8d5524];

        pedestrianPositions.forEach((pos, i) => {
            const skinColor = skinColors[i % skinColors.length];
            const pedestrian = pos.gender === 'male'
                ? this.createMalePedestrian(skinColor)
                : this.createFemalePedestrian(skinColor);

            pedestrian.position.set(pos.x, 0, pos.z);
            pedestrian.rotation.y = Math.random() * Math.PI * 2;

            pedestrian.userData = {
                type: 'pedestrian',
                gender: pos.gender,
                walkRadius: 3 + Math.random() * 2,
                walkSpeed: 0.3 + Math.random() * 0.2,
                startX: pos.x,
                startZ: pos.z,
                angle: Math.random() * Math.PI * 2,
                bobPhase: Math.random() * Math.PI * 2,
                leftLeg: pedestrian.getObjectByName('leftLeg'),
                rightLeg: pedestrian.getObjectByName('rightLeg'),
                leftArm: pedestrian.getObjectByName('leftArm'),
                rightArm: pedestrian.getObjectByName('rightArm')
            };

            this.scene.add(pedestrian);
            this.pedestrians.push(pedestrian);
        });
    }

    // Male pedestrian in corporate clothes (shirt, pants, tie)
    createMalePedestrian(skinColor) {
        const pedestrian = new THREE.Group();
        pedestrian.scale.set(1.2, 1.2, 1.2); // Make them bigger and more visible

        // Corporate shirt colors
        const shirtColors = [0xffffff, 0xe6f2ff, 0xf5f5dc, 0xd3e4f5];
        const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];
        const pantsColor = 0x2c3e50; // Dark formal pants
        const tieColors = [0x8b0000, 0x000080, 0x2f4f4f, 0x4a0080];
        const tieColor = tieColors[Math.floor(Math.random() * tieColors.length)];

        // Torso (shirt)
        const torsoGeometry = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 8);
        const torsoMaterial = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 0.85;
        torso.castShadow = true;
        pedestrian.add(torso);

        // Tie
        const tieGeometry = new THREE.BoxGeometry(0.06, 0.35, 0.02);
        const tieMaterial = new THREE.MeshStandardMaterial({ color: tieColor, roughness: 0.5 });
        const tie = new THREE.Mesh(tieGeometry, tieMaterial);
        tie.position.set(0, 0.8, 0.12);
        pedestrian.add(tie);

        // Tie knot
        const knotGeometry = new THREE.BoxGeometry(0.08, 0.05, 0.03);
        const knot = new THREE.Mesh(knotGeometry, tieMaterial);
        knot.position.set(0, 1.0, 0.12);
        pedestrian.add(knot);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.14, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.25;
        head.castShadow = true;
        pedestrian.add(head);

        // Hair (short male hair)
        const hairGeometry = new THREE.SphereGeometry(0.145, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairColors = [0x1a1a1a, 0x2d1b0e, 0x4a3728, 0x1c1c1c];
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: hairColors[Math.floor(Math.random() * hairColors.length)],
            roughness: 0.9
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 1.3;
        pedestrian.add(hair);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.05, 1.27, 0.12);
        pedestrian.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.05, 1.27, 0.12);
        pedestrian.add(rightEye);

        // Formal pants (legs)
        const legGeometry = new THREE.CylinderGeometry(0.07, 0.06, 0.5, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(0.09, 0.3, 0);
        leftLeg.name = 'leftLeg';
        leftLeg.castShadow = true;
        pedestrian.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(-0.09, 0.3, 0);
        rightLeg.name = 'rightLeg';
        rightLeg.castShadow = true;
        pedestrian.add(rightLeg);

        // Shoes
        const shoeGeometry = new THREE.BoxGeometry(0.08, 0.04, 0.14);
        const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.5 });
        const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        leftShoe.position.set(0.09, 0.02, 0.02);
        pedestrian.add(leftShoe);
        const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        rightShoe.position.set(-0.09, 0.02, 0.02);
        pedestrian.add(rightShoe);

        // Arms (shirt sleeves)
        const upperArmGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.25, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7 });
        const skinMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });

        const leftArm = new THREE.Group();
        const leftUpperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
        leftUpperArm.position.y = -0.05;
        leftArm.add(leftUpperArm);
        const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMaterial);
        leftHand.position.y = -0.2;
        leftArm.add(leftHand);
        leftArm.position.set(0.25, 0.9, 0);
        leftArm.rotation.z = 0.15;
        leftArm.name = 'leftArm';
        pedestrian.add(leftArm);

        const rightArm = new THREE.Group();
        const rightUpperArm = new THREE.Mesh(upperArmGeometry, armMaterial);
        rightUpperArm.position.y = -0.05;
        rightArm.add(rightUpperArm);
        const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMaterial);
        rightHand.position.y = -0.2;
        rightArm.add(rightHand);
        rightArm.position.set(-0.25, 0.9, 0);
        rightArm.rotation.z = -0.15;
        rightArm.name = 'rightArm';
        pedestrian.add(rightArm);

        return pedestrian;
    }

    // Female pedestrian in casual clothes (t-shirt and shorts)
    createFemalePedestrian(skinColor) {
        const pedestrian = new THREE.Group();
        pedestrian.scale.set(1.1, 1.1, 1.1); // Slightly smaller than male

        // Casual t-shirt colors
        const tshirtColors = [0xff6b9d, 0x87ceeb, 0xffd700, 0x98fb98, 0xffb6c1, 0xe6e6fa];
        const tshirtColor = tshirtColors[Math.floor(Math.random() * tshirtColors.length)];
        const shortsColors = [0x4169e1, 0x2f4f4f, 0x8b4513, 0xffffff];
        const shortsColor = shortsColors[Math.floor(Math.random() * shortsColors.length)];

        // Torso (t-shirt) - slightly different shape
        const torsoGeometry = new THREE.CylinderGeometry(0.16, 0.18, 0.45, 8);
        const torsoMaterial = new THREE.MeshStandardMaterial({ color: tshirtColor, roughness: 0.8 });
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 0.8;
        torso.castShadow = true;
        pedestrian.add(torso);

        // Head
        const headGeometry = new THREE.SphereGeometry(0.13, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.15;
        head.castShadow = true;
        pedestrian.add(head);

        // Long hair
        const hairColors = [0x1a1a1a, 0x4a3728, 0x8b4513, 0xd4a574, 0xffd700, 0x8b0000];
        const hairColor = hairColors[Math.floor(Math.random() * hairColors.length)];
        const hairMaterial = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.9 });

        // Hair top
        const hairTopGeometry = new THREE.SphereGeometry(0.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairTop = new THREE.Mesh(hairTopGeometry, hairMaterial);
        hairTop.position.y = 1.2;
        pedestrian.add(hairTop);

        // Long hair back
        const hairBackGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.35, 8);
        const hairBack = new THREE.Mesh(hairBackGeometry, hairMaterial);
        hairBack.position.set(0, 0.95, -0.08);
        pedestrian.add(hairBack);

        // Hair sides (ponytail effect)
        const hairSideGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const hairLeft = new THREE.Mesh(hairSideGeometry, hairMaterial);
        hairLeft.position.set(0.12, 1.1, 0);
        pedestrian.add(hairLeft);
        const hairRight = new THREE.Mesh(hairSideGeometry, hairMaterial);
        hairRight.position.set(-0.12, 1.1, 0);
        pedestrian.add(hairRight);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.018, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.045, 1.17, 0.11);
        pedestrian.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.045, 1.17, 0.11);
        pedestrian.add(rightEye);

        // Shorts (short legs showing skin)
        const shortsGeometry = new THREE.CylinderGeometry(0.08, 0.07, 0.18, 8);
        const shortsMaterial = new THREE.MeshStandardMaterial({ color: shortsColor, roughness: 0.7 });

        const leftShorts = new THREE.Mesh(shortsGeometry, shortsMaterial);
        leftShorts.position.set(0.07, 0.48, 0);
        pedestrian.add(leftShorts);

        const rightShorts = new THREE.Mesh(shortsGeometry, shortsMaterial);
        rightShorts.position.set(-0.07, 0.48, 0);
        pedestrian.add(rightShorts);

        // Legs (skin showing below shorts)
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.045, 0.3, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });

        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(0.07, 0.2, 0);
        leftLeg.name = 'leftLeg';
        leftLeg.castShadow = true;
        pedestrian.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(-0.07, 0.2, 0);
        rightLeg.name = 'rightLeg';
        rightLeg.castShadow = true;
        pedestrian.add(rightLeg);

        // Sneakers
        const sneakerGeometry = new THREE.BoxGeometry(0.07, 0.04, 0.12);
        const sneakerMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
        const leftSneaker = new THREE.Mesh(sneakerGeometry, sneakerMaterial);
        leftSneaker.position.set(0.07, 0.02, 0.02);
        pedestrian.add(leftSneaker);
        const rightSneaker = new THREE.Mesh(sneakerGeometry, sneakerMaterial);
        rightSneaker.position.set(-0.07, 0.02, 0.02);
        pedestrian.add(rightSneaker);

        // Arms (skin showing - t-shirt is short sleeve)
        const armGeometry = new THREE.CylinderGeometry(0.035, 0.03, 0.25, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });

        const leftArm = new THREE.Group();
        const leftArmMesh = new THREE.Mesh(armGeometry, armMaterial);
        leftArmMesh.position.y = -0.05;
        leftArm.add(leftArmMesh);
        const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), armMaterial);
        leftHand.position.y = -0.18;
        leftArm.add(leftHand);
        leftArm.position.set(0.2, 0.85, 0);
        leftArm.rotation.z = 0.2;
        leftArm.name = 'leftArm';
        pedestrian.add(leftArm);

        const rightArm = new THREE.Group();
        const rightArmMesh = new THREE.Mesh(armGeometry, armMaterial);
        rightArmMesh.position.y = -0.05;
        rightArm.add(rightArmMesh);
        const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), armMaterial);
        rightHand.position.y = -0.18;
        rightArm.add(rightHand);
        rightArm.position.set(-0.2, 0.85, 0);
        rightArm.rotation.z = -0.2;
        rightArm.name = 'rightArm';
        pedestrian.add(rightArm);

        return pedestrian;
    }

    // Check if two cars are colliding
    checkCarCollision(car1, car2) {
        const dx = car1.position.x - car2.position.x;
        const dz = car1.position.z - car2.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        return distance < this.carCollisionRadius;
    }

    update(delta) {
        // Update cars with collision detection
        this.cars.forEach((car, index) => {
            const data = car.userData;

            // Store previous position for collision response
            const prevX = car.position.x;
            const prevZ = car.position.z;

            if (data.radius) {
                // Circular road movement
                data.angle += data.speed * delta * data.direction;
                car.position.x = Math.cos(data.angle) * data.radius;
                car.position.z = Math.sin(data.angle) * data.radius;
                car.rotation.y = data.angle + Math.PI / 2 * data.direction;
            } else if (data.axis) {
                // Straight road movement
                if (data.axis === 'x') {
                    car.position.x += data.speed * data.direction * delta * 20;
                    if (car.position.x > data.max || car.position.x < data.min) {
                        data.direction *= -1;
                        car.rotation.y += Math.PI;
                    }
                } else {
                    car.position.z += data.speed * data.direction * delta * 20;
                    if (car.position.z > data.max || car.position.z < data.min) {
                        data.direction *= -1;
                        car.rotation.y += Math.PI;
                    }
                }
            }

            // Check collision with other cars
            for (let j = index + 1; j < this.cars.length; j++) {
                const otherCar = this.cars[j];
                if (this.checkCarCollision(car, otherCar)) {
                    // Collision detected - reverse direction for both cars
                    data.direction *= -1;
                    otherCar.userData.direction *= -1;

                    // Push cars apart
                    car.position.x = prevX;
                    car.position.z = prevZ;

                    // Update rotation for straight road cars
                    if (data.axis) {
                        car.rotation.y += Math.PI;
                    }
                    if (otherCar.userData.axis) {
                        otherCar.rotation.y += Math.PI;
                    }
                }
            }
        });

        // Update pedestrians with walking animation
        this.pedestrians.forEach(ped => {
            const data = ped.userData;

            // Walk in a small circle
            data.angle += data.walkSpeed * delta;
            ped.position.x = data.startX + Math.cos(data.angle) * data.walkRadius;
            ped.position.z = data.startZ + Math.sin(data.angle) * data.walkRadius;
            ped.rotation.y = data.angle + Math.PI / 2;

            // Walking animation phase
            data.bobPhase += delta * 8;

            // Bobbing animation (up and down)
            ped.position.y = Math.abs(Math.sin(data.bobPhase)) * 0.05;

            // Animate legs if they exist
            if (data.leftLeg && data.rightLeg) {
                const legSwing = Math.sin(data.bobPhase) * 0.4;
                data.leftLeg.rotation.x = legSwing;
                data.rightLeg.rotation.x = -legSwing;
            }

            // Animate arms if they exist
            if (data.leftArm && data.rightArm) {
                const armSwing = Math.sin(data.bobPhase) * 0.3;
                data.leftArm.rotation.x = -armSwing;
                data.rightArm.rotation.x = armSwing;
            }
        });
    }
}
