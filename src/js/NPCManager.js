import * as THREE from 'three';
import { NPCVehicle } from './NPCVehicle.js';

export class NPCManager {
    constructor(scene, isNightMode, roadNetwork = null, trafficManager = null) {
        this.scene = scene;
        this.isNightMode = isNightMode;
        this.roadNetwork = roadNetwork;
        this.trafficManager = trafficManager;
        this.npcs = [];
        this.vehicles = [];
        this.pedestrians = [];
        this.playerVehicle = null; // Reference to player vehicle for collision detection
    }

    setPlayerVehicle(vehicle) {
        this.playerVehicle = vehicle;
    }

    create() {
        // Create NPC vehicles on the roads
        this.createVehicles();

        // Create detailed pedestrians near buildings
        this.createDetailedPedestrians();
    }

    createVehicles() {
        // Number of NPC vehicles based on city size
        const numVehicles = this.roadNetwork ? 15 : 6;

        for (let i = 0; i < numVehicles; i++) {
            const vehicle = new NPCVehicle(
                this.scene,
                this.roadNetwork,
                this.trafficManager,
                this.isNightMode
            );

            // Get a spawn point from road network or use default positions
            let x, z, heading;
            if (this.roadNetwork) {
                const spawnData = this.roadNetwork.getRandomSpawnPoint();
                x = spawnData.position.x;
                z = spawnData.position.z;
                // Calculate heading based on lane direction
                heading = spawnData.direction > 0 ? 0 : Math.PI;
            } else {
                // Fallback for no road network - circular road
                const angle = (i / numVehicles) * Math.PI * 2;
                const radius = 40;
                x = Math.cos(angle) * radius;
                z = Math.sin(angle) * radius;
                heading = angle + Math.PI / 2;
            }

            vehicle.spawn(x, z, heading);
            this.vehicles.push(vehicle);
        }
    }

    createDetailedPedestrians() {
        // Generate pedestrian positions based on city layout
        let pedestrianPositions;

        if (this.roadNetwork) {
            // Place pedestrians along sidewalks in the city
            pedestrianPositions = this.generateCityPedestrianPositions();
        } else {
            // Fallback positions
            pedestrianPositions = [
                { x: 15, z: 15, gender: 'male' },
                { x: -15, z: 15, gender: 'female' },
                { x: 15, z: -15, gender: 'female' },
                { x: -15, z: -15, gender: 'male' },
                { x: 50, z: 50, gender: 'male' },
                { x: -50, z: 50, gender: 'female' },
                { x: 50, z: -50, gender: 'male' },
                { x: -50, z: -50, gender: 'female' }
            ];
        }

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
                rightArm: pedestrian.getObjectByName('rightArm'),
                // Collision/reaction state
                isScared: false,
                scaredTimer: 0,
                dodgeDirection: new THREE.Vector3(),
                originalY: 0
            };

            this.scene.add(pedestrian);
            this.pedestrians.push(pedestrian);
        });
    }

    generateCityPedestrianPositions() {
        const positions = [];
        const genders = ['male', 'female'];

        // Place pedestrians near intersections (on sidewalks)
        if (this.roadNetwork) {
            const intersections = this.roadNetwork.getIntersections();
            intersections.forEach((intersection, i) => {
                // Place 2 pedestrians near each intersection on the sidewalks
                const offsets = [
                    { x: 8, z: 8 },
                    { x: -8, z: -8 }
                ];

                offsets.forEach((offset, j) => {
                    positions.push({
                        x: intersection.x + offset.x,
                        z: intersection.z + offset.z,
                        gender: genders[(i + j) % 2]
                    });
                });
            });
        }

        // Add some pedestrians in building areas
        const buildingAreaPositions = [
            { x: 40, z: 40 },
            { x: -40, z: 40 },
            { x: 40, z: -40 },
            { x: -40, z: -40 },
            { x: 80, z: 0 },
            { x: -80, z: 0 },
            { x: 0, z: 80 },
            { x: 0, z: -80 },
            { x: 60, z: 60 },
            { x: -60, z: 60 },
            { x: 60, z: -60 },
            { x: -60, z: -60 }
        ];

        buildingAreaPositions.forEach((pos, i) => {
            positions.push({
                x: pos.x + (Math.random() - 0.5) * 10,
                z: pos.z + (Math.random() - 0.5) * 10,
                gender: genders[i % 2]
            });
        });

        return positions;
    }

    // Male pedestrian in corporate clothes (shirt, pants, tie)
    createMalePedestrian(skinColor) {
        const pedestrian = new THREE.Group();
        pedestrian.scale.set(1.2, 1.2, 1.2);

        const shirtColors = [0xffffff, 0xe6f2ff, 0xf5f5dc, 0xd3e4f5];
        const shirtColor = shirtColors[Math.floor(Math.random() * shirtColors.length)];
        const pantsColor = 0x2c3e50;
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
        pedestrian.scale.set(1.1, 1.1, 1.1);

        const tshirtColors = [0xff6b9d, 0x87ceeb, 0xffd700, 0x98fb98, 0xffb6c1, 0xe6e6fa];
        const tshirtColor = tshirtColors[Math.floor(Math.random() * tshirtColors.length)];
        const shortsColors = [0x4169e1, 0x2f4f4f, 0x8b4513, 0xffffff];
        const shortsColor = shortsColors[Math.floor(Math.random() * shortsColors.length)];

        // Torso (t-shirt)
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

        // Hair sides
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

        // Shorts
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

    update(delta) {
        // Update NPC vehicles with intelligent AI
        this.vehicles.forEach(vehicle => {
            vehicle.update(delta, this.vehicles);
        });

        // Update pedestrians with walking animation and vehicle collision detection
        this.pedestrians.forEach(ped => {
            const data = ped.userData;

            // Check for nearby vehicles (player and NPCs)
            const nearbyVehicle = this.checkNearbyVehicles(ped.position);

            if (nearbyVehicle) {
                // Vehicle is too close! Trigger scared/dodge behavior
                if (!data.isScared) {
                    data.isScared = true;
                    data.scaredTimer = 2.0; // Stay scared for 2 seconds

                    // Calculate dodge direction (perpendicular to vehicle direction)
                    const toVehicle = new THREE.Vector3(
                        nearbyVehicle.x - ped.position.x,
                        0,
                        nearbyVehicle.z - ped.position.z
                    ).normalize();

                    // Dodge perpendicular to vehicle approach (left or right randomly)
                    const dodgeSide = Math.random() > 0.5 ? 1 : -1;
                    data.dodgeDirection.set(
                        -toVehicle.z * dodgeSide,
                        0,
                        toVehicle.x * dodgeSide
                    );

                    // Update start position to current position after dodge
                    data.startX = ped.position.x + data.dodgeDirection.x * 3;
                    data.startZ = ped.position.z + data.dodgeDirection.z * 3;
                }
            }

            if (data.isScared) {
                // Scared behavior: jump to the side and cower
                data.scaredTimer -= delta;

                // Quick dodge movement
                if (data.scaredTimer > 1.5) {
                    // Jump animation - move quickly and hop
                    const jumpProgress = (2.0 - data.scaredTimer) / 0.5;
                    ped.position.x += data.dodgeDirection.x * delta * 8;
                    ped.position.z += data.dodgeDirection.z * delta * 8;

                    // Jump arc
                    ped.position.y = Math.sin(jumpProgress * Math.PI) * 0.5;

                    // Face away from danger
                    ped.rotation.y = Math.atan2(data.dodgeDirection.x, data.dodgeDirection.z);
                } else {
                    // Cowering animation - crouch down
                    ped.position.y = 0;
                    ped.scale.y = 0.8; // Crouch

                    // Arms up in defensive position
                    if (data.leftArm && data.rightArm) {
                        data.leftArm.rotation.x = -1.2;
                        data.leftArm.rotation.z = 0.5;
                        data.rightArm.rotation.x = -1.2;
                        data.rightArm.rotation.z = -0.5;
                    }
                }

                // Recovery
                if (data.scaredTimer <= 0) {
                    data.isScared = false;
                    ped.scale.y = data.gender === 'male' ? 1.2 : 1.1; // Restore original scale
                }
            } else {
                // Normal walking behavior

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
            }
        });
    }

    /**
     * Check if any vehicle is within danger distance of the pedestrian
     * @param {THREE.Vector3} pedPosition - Pedestrian position
     * @returns {Object|null} - Nearest vehicle position or null if none nearby
     */
    checkNearbyVehicles(pedPosition) {
        const dangerDistance = 4; // Distance at which pedestrian should react
        let nearestVehicle = null;
        let nearestDist = dangerDistance;

        // Check player vehicle
        if (this.playerVehicle) {
            const playerPos = this.playerVehicle.getPosition();
            const playerSpeed = Math.abs(this.playerVehicle.getSpeed());

            // Only react if vehicle is moving
            if (playerSpeed > 5) {
                const dx = playerPos.x - pedPosition.x;
                const dz = playerPos.z - pedPosition.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                // Adjust danger distance based on speed
                const adjustedDanger = dangerDistance + playerSpeed * 0.05;

                if (dist < adjustedDanger && dist < nearestDist) {
                    nearestDist = dist;
                    nearestVehicle = { x: playerPos.x, z: playerPos.z };
                }
            }
        }

        // Check NPC vehicles
        this.vehicles.forEach(vehicle => {
            if (vehicle.speed > 3) {
                const dx = vehicle.position.x - pedPosition.x;
                const dz = vehicle.position.z - pedPosition.z;
                const dist = Math.sqrt(dx * dx + dz * dz);

                const adjustedDanger = dangerDistance + vehicle.speed * 0.05;

                if (dist < adjustedDanger && dist < nearestDist) {
                    nearestDist = dist;
                    nearestVehicle = { x: vehicle.position.x, z: vehicle.position.z };
                }
            }
        });

        return nearestVehicle;
    }

    getVehicles() {
        return this.vehicles;
    }

    destroy() {
        // Clean up vehicles
        this.vehicles.forEach(vehicle => {
            vehicle.destroy();
        });
        this.vehicles = [];

        // Clean up pedestrians
        this.pedestrians.forEach(ped => {
            this.scene.remove(ped);
            ped.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.pedestrians = [];
    }
}
