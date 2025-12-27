import * as THREE from 'three';

/**
 * TrafficLight - Visual traffic light with state machine
 * Manages light cycling and provides state for traffic control
 */
export class TrafficLight {
    constructor(scene, intersection, isNightMode = false) {
        this.scene = scene;
        this.intersection = intersection;
        this.isNightMode = isNightMode;

        // State machine
        this.phases = [
            { name: 'NS_GREEN', duration: 10, ns: 'green', ew: 'red' },
            { name: 'NS_YELLOW', duration: 2, ns: 'yellow', ew: 'red' },
            { name: 'ALL_RED_1', duration: 1, ns: 'red', ew: 'red' },
            { name: 'EW_GREEN', duration: 10, ns: 'red', ew: 'green' },
            { name: 'EW_YELLOW', duration: 2, ns: 'red', ew: 'yellow' },
            { name: 'ALL_RED_2', duration: 1, ns: 'red', ew: 'red' }
        ];

        this.currentPhaseIndex = 0;
        this.phaseTimer = 0;
        this.phaseOffset = 0; // For green wave synchronization

        // Visual elements
        this.mesh = new THREE.Group();
        this.lights = {
            north: null,
            south: null,
            east: null,
            west: null
        };

        this.create();
    }

    create() {
        const pos = this.intersection.position;

        // Create 4 traffic lights at corners of intersection
        const corners = [
            { dir: 'north', x: pos.x + 5, z: pos.z + 5, rotation: Math.PI },
            { dir: 'south', x: pos.x - 5, z: pos.z - 5, rotation: 0 },
            { dir: 'east', x: pos.x + 5, z: pos.z - 5, rotation: -Math.PI / 2 },
            { dir: 'west', x: pos.x - 5, z: pos.z + 5, rotation: Math.PI / 2 }
        ];

        corners.forEach(corner => {
            const lightPost = this.createLightPost(corner.dir);
            lightPost.position.set(corner.x, 0, corner.z);
            lightPost.rotation.y = corner.rotation;
            this.mesh.add(lightPost);
        });

        this.scene.add(this.mesh);

        // Initial state
        this.updateLightColors();
    }

    createLightPost(direction) {
        const group = new THREE.Group();

        // Materials
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.5
        });

        const housingMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.3,
            roughness: 0.6
        });

        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.15, 0.18, 5, 8);
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 2.5;
        pole.castShadow = true;
        group.add(pole);

        // Horizontal arm
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
        const arm = new THREE.Mesh(armGeometry, poleMaterial);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(-1.5, 4.8, 0);
        group.add(arm);

        // Light housing
        const housingGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.4);
        const housing = new THREE.Mesh(housingGeometry, housingMaterial);
        housing.position.set(-2.5, 4.5, 0);
        housing.castShadow = true;
        group.add(housing);

        // Hood/visor for each light
        const visorGeometry = new THREE.BoxGeometry(0.7, 0.1, 0.5);
        const visorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

        for (let i = 0; i < 3; i++) {
            const visor = new THREE.Mesh(visorGeometry, visorMaterial);
            visor.position.set(-2.7, 5.0 - i * 0.45, 0);
            group.add(visor);
        }

        // Create the 3 lights
        const lightPositions = [
            { y: 5.0, color: 'red' },
            { y: 4.55, color: 'yellow' },
            { y: 4.1, color: 'green' }
        ];

        const lightGroup = {
            red: null,
            yellow: null,
            green: null
        };

        lightPositions.forEach(lp => {
            const lightGeometry = new THREE.CircleGeometry(0.15, 16);
            const lightMaterial = new THREE.MeshStandardMaterial({
                color: this.getLightColor(lp.color, false),
                emissive: this.getLightColor(lp.color, false),
                emissiveIntensity: 0.2
            });

            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(-2.8, lp.y, 0);
            group.add(light);

            lightGroup[lp.color] = light;
        });

        this.lights[direction] = lightGroup;

        return group;
    }

    getLightColor(type, isActive) {
        const colors = {
            red: isActive ? 0xff0000 : 0x330000,
            yellow: isActive ? 0xffff00 : 0x333300,
            green: isActive ? 0x00ff00 : 0x003300
        };
        return colors[type];
    }

    updateLightColors() {
        const phase = this.phases[this.currentPhaseIndex];

        // Update North-South lights
        ['north', 'south'].forEach(dir => {
            if (this.lights[dir]) {
                this.setLightState(this.lights[dir], phase.ns);
            }
        });

        // Update East-West lights
        ['east', 'west'].forEach(dir => {
            if (this.lights[dir]) {
                this.setLightState(this.lights[dir], phase.ew);
            }
        });
    }

    setLightState(lightGroup, state) {
        ['red', 'yellow', 'green'].forEach(color => {
            if (lightGroup[color]) {
                const isActive = color === state;
                const intensity = isActive ? (this.isNightMode ? 3 : 1.5) : 0.1;

                lightGroup[color].material.color.setHex(this.getLightColor(color, isActive));
                lightGroup[color].material.emissive.setHex(this.getLightColor(color, isActive));
                lightGroup[color].material.emissiveIntensity = intensity;
            }
        });
    }

    update(delta) {
        this.phaseTimer += delta;

        const currentPhase = this.phases[this.currentPhaseIndex];
        if (this.phaseTimer >= currentPhase.duration) {
            this.phaseTimer = 0;
            this.currentPhaseIndex = (this.currentPhaseIndex + 1) % this.phases.length;
            this.updateLightColors();
        }
    }

    /**
     * Get current light state for a direction
     * @param {string} direction - 'north', 'south', 'east', or 'west'
     * @returns {string} - 'red', 'yellow', or 'green'
     */
    getState(direction) {
        const phase = this.phases[this.currentPhaseIndex];

        if (direction === 'north' || direction === 'south') {
            return phase.ns;
        } else {
            return phase.ew;
        }
    }

    /**
     * Check if traffic can proceed in given direction
     * @param {string} direction - 'north', 'south', 'east', or 'west'
     * @returns {boolean}
     */
    canProceed(direction) {
        const state = this.getState(direction);
        return state === 'green';
    }

    /**
     * Check if traffic should prepare to stop
     * @param {string} direction
     * @returns {boolean}
     */
    shouldPrepareToStop(direction) {
        const state = this.getState(direction);
        return state === 'yellow';
    }

    /**
     * Set phase offset for green wave synchronization
     * @param {number} offset - Offset in seconds
     */
    setPhaseOffset(offset) {
        this.phaseOffset = offset;
        this.phaseTimer = offset % this.getTotalCycleDuration();

        // Find correct phase for offset
        let elapsed = this.phaseTimer;
        for (let i = 0; i < this.phases.length; i++) {
            if (elapsed < this.phases[i].duration) {
                this.currentPhaseIndex = i;
                this.phaseTimer = elapsed;
                break;
            }
            elapsed -= this.phases[i].duration;
        }

        this.updateLightColors();
    }

    getTotalCycleDuration() {
        return this.phases.reduce((sum, p) => sum + p.duration, 0);
    }

    /**
     * Get intersection ID
     */
    getIntersectionId() {
        return this.intersection.id;
    }

    /**
     * Get position
     */
    getPosition() {
        return this.intersection.position;
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }
}
