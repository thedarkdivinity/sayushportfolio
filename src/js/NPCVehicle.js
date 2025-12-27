import * as THREE from 'three';

/**
 * NPCVehicle - Intelligent NPC vehicle with lane-following and traffic awareness
 * States: driving, stopping, waiting, turning, accelerating
 */
export class NPCVehicle {
    constructor(scene, roadNetwork, trafficManager, isNightMode = false) {
        this.scene = scene;
        this.roadNetwork = roadNetwork;
        this.trafficManager = trafficManager;
        this.isNightMode = isNightMode;

        // Position and movement
        this.position = new THREE.Vector3();
        this.rotation = 0;
        this.speed = 0;
        this.targetSpeed = 30;
        this.maxSpeed = 50;

        // Physics
        this.acceleration = 15;
        this.brakeForce = 25;
        this.friction = 0.98;
        this.turnSpeed = 2.0;

        // Navigation
        this.currentLane = null;
        this.currentWaypointId = null;
        this.targetWaypoint = null;
        this.waypointIndex = 0;

        // Behavior state
        this.state = 'driving'; // driving, stopping, waiting, turning
        this.stoppingDistance = 0;
        this.waitTimer = 0;
        this.minWaitTime = 0.5;

        // Turn signals
        this.turnSignal = null; // 'left', 'right', or null
        this.turnSignalTimer = 0;
        this.turnSignalVisible = false;

        // Following distance
        this.followDistance = 8;
        this.safeDistance = 5;

        // Vehicle ahead detection
        this.vehicleAhead = null;
        this.distanceToVehicleAhead = Infinity;

        // Segment following
        this.currentSegment = null;
        this.segmentProgress = 0;
        this.segmentDirection = 1;
        this.laneOffset = 0;

        // Visual
        this.mesh = null;
        this.wheels = [];
        this.wheelRotation = 0;
        this.brakeLights = null;
        this.turnSignalMeshes = { left: null, right: null };

        // Vehicle color (random from palette)
        this.colors = [0x2c3e50, 0xe74c3c, 0x3498db, 0x27ae60, 0x9b59b6, 0xf39c12, 0x1abc9c, 0xecf0f1];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    /**
     * Create the vehicle mesh
     */
    create() {
        this.mesh = new THREE.Group();

        // Materials
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.color,
            metalness: 0.6,
            roughness: 0.4
        });

        const glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            metalness: 0.9,
            roughness: 0.1,
            transparent: true,
            opacity: 0.7
        });

        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.2,
            roughness: 0.8
        });

        const chromeMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });

        // Car body (sedan shape)
        const bodyGeometry = new THREE.BoxGeometry(1.8, 0.5, 0.9);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.4;
        body.castShadow = true;
        this.mesh.add(body);

        // Cabin
        const cabinGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.85);
        const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
        cabin.position.set(-0.1, 0.75, 0);
        cabin.castShadow = true;
        this.mesh.add(cabin);

        // Windshield
        const windshieldGeometry = new THREE.BoxGeometry(0.05, 0.35, 0.8);
        const windshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
        windshield.position.set(0.5, 0.75, 0);
        windshield.rotation.z = 0.3;
        this.mesh.add(windshield);

        // Rear window
        const rearWindowGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.75);
        const rearWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
        rearWindow.position.set(-0.55, 0.75, 0);
        rearWindow.rotation.z = -0.3;
        this.mesh.add(rearWindow);

        // Side windows
        const sideWindowGeometry = new THREE.BoxGeometry(0.8, 0.25, 0.05);
        const leftWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
        leftWindow.position.set(-0.1, 0.8, 0.43);
        this.mesh.add(leftWindow);

        const rightWindow = leftWindow.clone();
        rightWindow.position.z = -0.43;
        this.mesh.add(rightWindow);

        // Headlights
        const headlightGeometry = new THREE.BoxGeometry(0.05, 0.12, 0.25);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffcc,
            emissiveIntensity: this.isNightMode ? 2 : 0.3
        });

        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(0.9, 0.4, 0.28);
        this.mesh.add(leftHeadlight);

        const rightHeadlight = leftHeadlight.clone();
        rightHeadlight.position.z = -0.28;
        this.mesh.add(rightHeadlight);

        // Taillights / Brake lights
        const taillightGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.2);
        const taillightMaterial = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.3
        });

        const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial.clone());
        leftTaillight.position.set(-0.9, 0.4, 0.3);
        this.mesh.add(leftTaillight);

        const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial.clone());
        rightTaillight.position.set(-0.9, 0.4, -0.3);
        this.mesh.add(rightTaillight);

        this.brakeLights = [leftTaillight, rightTaillight];

        // Turn signals
        const turnSignalGeometry = new THREE.BoxGeometry(0.05, 0.08, 0.1);
        const turnSignalMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            emissive: 0xffaa00,
            emissiveIntensity: 0
        });

        // Front turn signals
        const frontLeftSignal = new THREE.Mesh(turnSignalGeometry, turnSignalMaterial.clone());
        frontLeftSignal.position.set(0.9, 0.35, 0.42);
        this.mesh.add(frontLeftSignal);

        const frontRightSignal = new THREE.Mesh(turnSignalGeometry, turnSignalMaterial.clone());
        frontRightSignal.position.set(0.9, 0.35, -0.42);
        this.mesh.add(frontRightSignal);

        // Rear turn signals
        const rearLeftSignal = new THREE.Mesh(turnSignalGeometry, turnSignalMaterial.clone());
        rearLeftSignal.position.set(-0.9, 0.35, 0.42);
        this.mesh.add(rearLeftSignal);

        const rearRightSignal = new THREE.Mesh(turnSignalGeometry, turnSignalMaterial.clone());
        rearRightSignal.position.set(-0.9, 0.35, -0.42);
        this.mesh.add(rearRightSignal);

        this.turnSignalMeshes = {
            left: [frontLeftSignal, rearLeftSignal],
            right: [frontRightSignal, rearRightSignal]
        };

        // Wheels
        const wheelGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16);
        const wheelPositions = [
            { x: 0.55, y: 0.18, z: 0.45 },
            { x: 0.55, y: 0.18, z: -0.45 },
            { x: -0.55, y: 0.18, z: 0.45 },
            { x: -0.55, y: 0.18, z: -0.45 }
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.castShadow = true;
            this.mesh.add(wheel);
            this.wheels.push(wheel);

            // Wheel rim
            const rimGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.13, 8);
            const rim = new THREE.Mesh(rimGeometry, chromeMaterial);
            rim.rotation.x = Math.PI / 2;
            rim.position.set(pos.x, pos.y, pos.z);
            this.mesh.add(rim);
        });

        // Grille
        const grilleGeometry = new THREE.BoxGeometry(0.02, 0.15, 0.5);
        const grille = new THREE.Mesh(grilleGeometry, chromeMaterial);
        grille.position.set(0.9, 0.35, 0);
        this.mesh.add(grille);

        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);
    }

    /**
     * Spawn vehicle at position with heading
     */
    spawn(x, z, heading = 0) {
        // Create the mesh first
        this.create();

        // Set position and rotation
        this.position.set(x, 0, z);
        this.rotation = heading;

        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.y = this.rotation;
        }

        // Find nearby lane if road network exists
        if (this.roadNetwork) {
            const nearestLane = this.findNearestLane(x, z);
            if (nearestLane) {
                this.currentLane = nearestLane;
                this.targetSpeed = nearestLane.speedLimit || 30;
            }
        }

        this.speed = this.targetSpeed * 0.5;
    }

    /**
     * Find nearest lane to position
     */
    findNearestLane(x, z) {
        if (!this.roadNetwork || !this.roadNetwork.lanes) return null;

        let nearestLane = null;
        let nearestDist = Infinity;

        this.roadNetwork.lanes.forEach(lane => {
            if (lane.waypoints && lane.waypoints.length > 0) {
                lane.waypoints.forEach(wpId => {
                    const wp = this.roadNetwork.getWaypoint(wpId);
                    if (wp) {
                        const dist = Math.sqrt(
                            Math.pow(wp.position.x - x, 2) +
                            Math.pow(wp.position.z - z, 2)
                        );
                        if (dist < nearestDist) {
                            nearestDist = dist;
                            nearestLane = lane;
                        }
                    }
                });
            }
        });

        return nearestLane;
    }

    /**
     * Get next waypoint in current lane
     */
    getNextWaypoint() {
        if (!this.currentLane || !this.currentWaypointId) return null;

        const currentIndex = this.currentLane.waypoints.indexOf(this.currentWaypointId);
        const direction = this.currentLane.direction || 1;
        const nextIndex = currentIndex + direction;

        if (nextIndex < 0 || nextIndex >= this.currentLane.waypoints.length) {
            // End of lane, find connecting lane
            const currentWp = this.roadNetwork.getWaypoint(this.currentWaypointId);
            return this.roadNetwork.findConnectingWaypoint(currentWp, direction);
        }

        return this.roadNetwork.getWaypoint(this.currentLane.waypoints[nextIndex]);
    }

    /**
     * Main update loop
     */
    update(delta, allVehicles = []) {
        if (!this.mesh) return;

        // Check for traffic lights
        this.checkTrafficLights();

        // Check for vehicles ahead
        this.checkVehicleAhead(allVehicles);

        // Update state machine
        this.updateState(delta);

        // Update movement
        this.updateMovement(delta);

        // Update visuals
        this.updateVisuals(delta);

        // Update turn signals
        this.updateTurnSignals(delta);
    }

    /**
     * Check traffic lights ahead
     */
    checkTrafficLights() {
        if (!this.trafficManager) return;

        const result = this.trafficManager.shouldStop(
            { x: this.position.x, z: this.position.z },
            this.rotation,
            25
        );

        if (result.shouldStop && result.distance < 15) {
            this.state = 'stopping';
            this.stoppingDistance = result.distance - 5;
        } else if (this.state === 'stopping' || this.state === 'waiting') {
            if (!result.shouldStop) {
                this.state = 'accelerating';
            }
        }
    }

    /**
     * Check for vehicles ahead
     */
    checkVehicleAhead(allVehicles) {
        this.vehicleAhead = null;
        this.distanceToVehicleAhead = Infinity;

        const forward = {
            x: Math.sin(this.rotation),
            z: Math.cos(this.rotation)
        };

        allVehicles.forEach(other => {
            if (other === this) return;

            const dx = other.position.x - this.position.x;
            const dz = other.position.z - this.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > this.followDistance * 2) return;

            // Check if vehicle is ahead (dot product)
            const dot = dx * forward.x + dz * forward.z;
            if (dot < 0) return; // Behind us

            // Check if in same lane (lateral distance)
            const lateral = Math.abs(dx * forward.z - dz * forward.x);
            if (lateral > 3) return; // Different lane

            if (distance < this.distanceToVehicleAhead) {
                this.distanceToVehicleAhead = distance;
                this.vehicleAhead = other;
            }
        });

        // Adjust speed based on vehicle ahead
        if (this.vehicleAhead && this.distanceToVehicleAhead < this.followDistance) {
            if (this.distanceToVehicleAhead < this.safeDistance) {
                this.state = 'stopping';
            } else {
                // Match speed of vehicle ahead
                this.targetSpeed = Math.min(this.targetSpeed, this.vehicleAhead.speed);
            }
        }
    }

    /**
     * Update behavior state
     */
    updateState(delta) {
        switch (this.state) {
            case 'driving':
                this.targetSpeed = this.currentLane?.speedLimit || 30;
                break;

            case 'stopping':
                this.targetSpeed = 0;
                if (this.speed < 0.5) {
                    this.state = 'waiting';
                    this.waitTimer = 0;
                }
                break;

            case 'waiting':
                this.targetSpeed = 0;
                this.waitTimer += delta;
                break;

            case 'accelerating':
                this.targetSpeed = this.currentLane?.speedLimit || 30;
                if (this.speed > this.targetSpeed * 0.8) {
                    this.state = 'driving';
                }
                break;

            case 'turning':
                this.targetSpeed = 15; // Slow down for turns
                break;
        }
    }

    /**
     * Update position and rotation
     */
    updateMovement(delta) {
        // Speed control
        if (this.speed < this.targetSpeed) {
            this.speed += this.acceleration * delta;
        } else if (this.speed > this.targetSpeed) {
            this.speed -= this.brakeForce * delta;
        }

        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // Follow the current road segment
        if (this.currentSegment) {
            // Get target point along the road
            const target = this.getTargetPointOnSegment();

            if (target) {
                const dx = target.x - this.position.x;
                const dz = target.z - this.position.z;
                const distToTarget = Math.sqrt(dx * dx + dz * dz);

                // Calculate target rotation to face the target point
                const targetRotation = Math.atan2(dx, dz);

                // Smooth rotation towards target
                let angleDiff = targetRotation - this.rotation;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                // Turn signals for significant turns
                if (Math.abs(angleDiff) > 0.3) {
                    this.turnSignal = angleDiff > 0 ? 'left' : 'right';
                } else {
                    this.turnSignal = null;
                }

                this.rotation += angleDiff * delta * this.turnSpeed;

                // If close to target, advance progress
                if (distToTarget < 3) {
                    this.segmentProgress += 0.05;
                    if (this.segmentProgress >= 1) {
                        this.pickNextSegment();
                    }
                }
            }
        } else if (this.roadNetwork) {
            // Find nearest road segment to follow
            this.findNearestSegment();
        }

        // Keep within city bounds
        const cityBound = 135;
        if (Math.abs(this.position.x) > cityBound || Math.abs(this.position.z) > cityBound) {
            const toCenter = Math.atan2(-this.position.x, -this.position.z);
            let angleDiff = toCenter - this.rotation;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            this.rotation += angleDiff * delta * 3;
        }

        // Move forward
        this.position.x += Math.sin(this.rotation) * this.speed * delta;
        this.position.z += Math.cos(this.rotation) * this.speed * delta;

        // Update mesh
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.y = this.rotation;
        }
    }

    /**
     * Get target point on current segment based on progress
     */
    getTargetPointOnSegment() {
        if (!this.currentSegment) return null;

        const seg = this.currentSegment;
        const t = Math.min(this.segmentProgress + 0.2, 1); // Look slightly ahead

        if (seg.isCurved && seg.curveRadius) {
            // Curved segment (highway)
            const angle = seg.curveStartAngle + t * (seg.curveEndAngle - seg.curveStartAngle);
            const laneOffset = this.laneOffset || 0;
            const r = seg.curveRadius + laneOffset;
            return {
                x: Math.cos(angle) * r,
                z: Math.sin(angle) * r
            };
        } else {
            // Straight segment
            const laneOffset = this.laneOffset || 0;
            const dx = seg.end.x - seg.start.x;
            const dz = seg.end.z - seg.start.z;
            const len = Math.sqrt(dx * dx + dz * dz);
            const perpX = -dz / len * laneOffset;
            const perpZ = dx / len * laneOffset;

            return {
                x: seg.start.x + t * dx + perpX,
                z: seg.start.z + t * dz + perpZ
            };
        }
    }

    /**
     * Find nearest road segment
     */
    findNearestSegment() {
        if (!this.roadNetwork) return;

        let nearestSeg = null;
        let nearestDist = Infinity;

        for (const seg of this.roadNetwork.getSegments()) {
            // Calculate distance to segment
            let dist;
            if (seg.isCurved && seg.curveRadius) {
                dist = Math.abs(Math.sqrt(this.position.x * this.position.x + this.position.z * this.position.z) - seg.curveRadius);
            } else {
                const dx = seg.end.x - seg.start.x;
                const dz = seg.end.z - seg.start.z;
                const len = Math.sqrt(dx * dx + dz * dz);
                const t = Math.max(0, Math.min(1,
                    ((this.position.x - seg.start.x) * dx + (this.position.z - seg.start.z) * dz) / (len * len)
                ));
                const closestX = seg.start.x + t * dx;
                const closestZ = seg.start.z + t * dz;
                dist = Math.sqrt(Math.pow(this.position.x - closestX, 2) + Math.pow(this.position.z - closestZ, 2));
            }

            if (dist < nearestDist) {
                nearestDist = dist;
                nearestSeg = seg;
            }
        }

        if (nearestSeg && nearestDist < 20) {
            this.currentSegment = nearestSeg;
            this.segmentProgress = 0;
            this.segmentDirection = Math.random() > 0.5 ? 1 : -1;
            // Random lane offset (-1 to 1 lanes from center)
            this.laneOffset = (Math.random() - 0.5) * nearestSeg.width * 0.4;
            this.targetSpeed = nearestSeg.speedLimit || 30;
        }
    }

    /**
     * Pick next segment at intersection
     */
    pickNextSegment() {
        if (!this.roadNetwork) {
            this.segmentProgress = 0;
            return;
        }

        // Find connecting segments at current position
        const segments = this.roadNetwork.getSegments();
        const candidates = [];

        for (const seg of segments) {
            if (seg === this.currentSegment) continue;

            // Check if segment starts or ends near current position
            const distToStart = Math.sqrt(
                Math.pow(this.position.x - seg.start.x, 2) +
                Math.pow(this.position.z - seg.start.z, 2)
            );
            const distToEnd = Math.sqrt(
                Math.pow(this.position.x - seg.end.x, 2) +
                Math.pow(this.position.z - seg.end.z, 2)
            );

            if (distToStart < 15 || distToEnd < 15) {
                candidates.push(seg);
            }
        }

        if (candidates.length > 0) {
            // Pick a random connecting segment
            this.currentSegment = candidates[Math.floor(Math.random() * candidates.length)];
            this.segmentProgress = 0;
            this.laneOffset = (Math.random() - 0.5) * this.currentSegment.width * 0.4;
            this.targetSpeed = this.currentSegment.speedLimit || 30;
        } else {
            // No connecting segment, continue on current
            this.segmentProgress = 0;
            this.segmentDirection *= -1; // Reverse direction
        }
    }

    /**
     * Update visual elements
     */
    updateVisuals(delta) {
        // Rotate wheels
        this.wheelRotation += this.speed * delta * 0.5;
        this.wheels.forEach(wheel => {
            wheel.rotation.y = this.wheelRotation;
        });

        // Brake lights
        const isBraking = this.state === 'stopping' || this.state === 'waiting' ||
            this.speed < this.targetSpeed - 5;

        this.brakeLights.forEach(light => {
            light.material.emissiveIntensity = isBraking ? 2 : 0.3;
        });
    }

    /**
     * Update turn signal blinking
     */
    updateTurnSignals(delta) {
        this.turnSignalTimer += delta;

        if (this.turnSignalTimer > 0.4) {
            this.turnSignalTimer = 0;
            this.turnSignalVisible = !this.turnSignalVisible;
        }

        // Update signal visibility
        ['left', 'right'].forEach(side => {
            const meshes = this.turnSignalMeshes[side];
            if (meshes) {
                const isActive = this.turnSignal === side && this.turnSignalVisible;
                meshes.forEach(mesh => {
                    mesh.material.emissiveIntensity = isActive ? 3 : 0;
                });
            }
        });
    }

    /**
     * Get position
     */
    getPosition() {
        return this.position;
    }

    /**
     * Get speed
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * Clean up
     */
    destroy() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}
