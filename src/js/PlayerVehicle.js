import * as THREE from 'three';

/**
 * Base class for player-controllable vehicles (Motorcycle, Car, etc.)
 * Provides common interface for position, rotation, speed, and updates
 */
export class PlayerVehicle {
    constructor(scene, world, isNightMode = false) {
        this.scene = scene;
        this.world = world;
        this.isNightMode = isNightMode;

        this.mesh = null;

        // Physics properties
        this.speed = 0;
        this.maxSpeed = 80;
        this.acceleration = 35;
        this.brakeForce = 50;
        this.turnSpeed = 2.5;
        this.friction = 0.98;

        // Position and rotation - start on main road away from intersection
        this.position = new THREE.Vector3(0, 0, 30);
        this.rotation = 0;

        // Collision detection
        this.obstacles = [];
        this.collisionRadius = 0.8;
    }

    /**
     * Create the vehicle mesh - must be implemented by subclasses
     */
    async create() {
        throw new Error('PlayerVehicle.create() must be implemented by subclass');
    }

    /**
     * Update vehicle state - must be implemented by subclasses
     * @param {number} delta - Time since last frame
     * @param {Object} input - Input state {forward, backward, left, right, brake}
     */
    update(delta, input) {
        throw new Error('PlayerVehicle.update() must be implemented by subclass');
    }

    /**
     * Register an obstacle for collision detection
     */
    addObstacle(x, z, width, depth) {
        this.obstacles.push({ x, z, width, depth });
    }

    /**
     * Clear all obstacles
     */
    clearObstacles() {
        this.obstacles = [];
    }

    /**
     * Check collision with obstacles at given position
     * @returns {boolean} True if collision detected
     */
    checkCollisions(newX, newZ) {
        for (const obs of this.obstacles) {
            // Use smaller collision radius to avoid getting stuck
            const halfWidth = obs.width / 2;
            const halfDepth = obs.depth / 2;

            if (Math.abs(newX - obs.x) < halfWidth && Math.abs(newZ - obs.z) < halfDepth) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get current position
     * @returns {THREE.Vector3}
     */
    getPosition() {
        return this.position;
    }

    /**
     * Get current rotation (Y-axis)
     * @returns {number}
     */
    getRotation() {
        return this.rotation;
    }

    /**
     * Get current speed
     * @returns {number}
     */
    getSpeed() {
        return this.speed;
    }

    /**
     * Check if vehicle is moving
     * @returns {boolean}
     */
    isMoving() {
        return Math.abs(this.speed) > 1;
    }

    /**
     * Set vehicle position
     * @param {THREE.Vector3} pos
     */
    setPosition(pos) {
        this.position.copy(pos);
        if (this.mesh) {
            this.mesh.position.copy(pos);
        }
    }

    /**
     * Set vehicle rotation
     * @param {number} rot
     */
    setRotation(rot) {
        this.rotation = rot;
        if (this.mesh) {
            this.mesh.rotation.y = rot;
        }
    }

    /**
     * Reset vehicle to starting position
     */
    reset() {
        this.position.set(0, 0, 30);
        this.rotation = 0;
        this.speed = 0;
        if (this.mesh) {
            this.mesh.position.copy(this.position);
            this.mesh.rotation.y = 0;
            this.mesh.rotation.z = 0;
        }
    }

    /**
     * Remove vehicle from scene
     */
    destroy() {
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
            // Dispose of geometries and materials
            this.mesh.traverse((child) => {
                if (child.geometry) {
                    child.geometry.dispose();
                }
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

    /**
     * Get vehicle type identifier
     * @returns {string}
     */
    getType() {
        return 'vehicle';
    }
}
