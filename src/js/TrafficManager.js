import * as THREE from 'three';
import { TrafficLight } from './TrafficLight.js';

/**
 * TrafficManager - Manages all traffic lights and coordinates traffic flow
 * Implements green wave algorithm for main roads
 */
export class TrafficManager {
    constructor(scene, roadNetwork, isNightMode = false) {
        this.scene = scene;
        this.roadNetwork = roadNetwork;
        this.isNightMode = isNightMode;

        // Traffic lights storage
        this.trafficLights = new Map(); // intersectionId -> TrafficLight

        // Green wave configuration
        this.greenWaveSpeed = 50; // km/h equivalent in game units
        this.baseCycleTime = 26; // Total cycle duration in seconds

        // Pedestrian signal timing (future use)
        this.pedestrianWalkDuration = 8;
    }

    /**
     * Create traffic lights at all signaled intersections
     */
    createTrafficLights() {
        const intersections = this.roadNetwork.getTrafficLightIntersections();

        intersections.forEach(intersection => {
            const light = new TrafficLight(this.scene, intersection, this.isNightMode);
            this.trafficLights.set(intersection.id, light);
        });

        // Apply green wave synchronization to main roads
        this.applyGreenWave();
    }

    /**
     * Apply green wave timing to main road intersections
     * Synchronizes lights so vehicles traveling at speed limit hit consecutive greens
     */
    applyGreenWave() {
        // Get main horizontal road intersections (sorted by x position)
        const mainHIntersections = Array.from(this.trafficLights.entries())
            .filter(([id]) => id.includes('intersection-') && id.includes('-1'))
            .sort((a, b) => {
                const lightA = a[1];
                const lightB = b[1];
                return lightA.getPosition().x - lightB.getPosition().x;
            });

        // Calculate offsets based on distance and speed
        let cumulativeOffset = 0;
        mainHIntersections.forEach(([id, light], index) => {
            if (index === 0) {
                light.setPhaseOffset(0);
            } else {
                const prevLight = mainHIntersections[index - 1][1];
                const distance = Math.abs(
                    light.getPosition().x - prevLight.getPosition().x
                );
                // Time to travel between intersections at green wave speed
                const travelTime = distance / this.greenWaveSpeed;
                cumulativeOffset += travelTime;
                light.setPhaseOffset(cumulativeOffset % this.baseCycleTime);
            }
        });

        // Similar for main vertical roads
        const mainVIntersections = Array.from(this.trafficLights.entries())
            .filter(([id]) => id.includes('intersection-1-'))
            .sort((a, b) => {
                const lightA = a[1];
                const lightB = b[1];
                return lightA.getPosition().z - lightB.getPosition().z;
            });

        cumulativeOffset = this.baseCycleTime / 2; // Offset from horizontal wave
        mainVIntersections.forEach(([id, light], index) => {
            if (index === 0) {
                light.setPhaseOffset(cumulativeOffset);
            } else {
                const prevLight = mainVIntersections[index - 1][1];
                const distance = Math.abs(
                    light.getPosition().z - prevLight.getPosition().z
                );
                const travelTime = distance / this.greenWaveSpeed;
                cumulativeOffset += travelTime;
                light.setPhaseOffset(cumulativeOffset % this.baseCycleTime);
            }
        });
    }

    /**
     * Update all traffic lights
     * @param {number} delta - Time since last frame
     */
    update(delta) {
        this.trafficLights.forEach(light => {
            light.update(delta);
        });
    }

    /**
     * Check if a vehicle should stop at the nearest intersection
     * @param {Object} position - Vehicle position {x, z}
     * @param {number} heading - Vehicle heading angle in radians
     * @param {number} checkDistance - Distance ahead to check for lights
     * @returns {Object} - { shouldStop, distance, intersection }
     */
    shouldStop(position, heading, checkDistance = 20) {
        // Find intersections ahead of the vehicle
        const lookAhead = {
            x: position.x + Math.sin(heading) * checkDistance,
            z: position.z + Math.cos(heading) * checkDistance
        };

        let nearestStopRequired = null;
        let nearestDistance = Infinity;

        this.trafficLights.forEach((light, id) => {
            const lightPos = light.getPosition();

            // Check if intersection is ahead
            const toLight = {
                x: lightPos.x - position.x,
                z: lightPos.z - position.z
            };

            const distance = Math.sqrt(toLight.x * toLight.x + toLight.z * toLight.z);

            if (distance > checkDistance || distance < 2) return;

            // Check if light is in front of vehicle (dot product)
            const forward = {
                x: Math.sin(heading),
                z: Math.cos(heading)
            };

            const dot = toLight.x * forward.x + toLight.z * forward.z;
            if (dot < 0) return; // Behind vehicle

            // Determine which direction vehicle is approaching from
            const direction = this.getApproachDirection(position, lightPos, heading);
            const lightState = light.getState(direction);

            if (lightState === 'red' || lightState === 'yellow') {
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestStopRequired = {
                        shouldStop: true,
                        distance: distance,
                        intersection: light.getIntersectionId(),
                        state: lightState,
                        stopPosition: this.getStopPosition(lightPos, direction)
                    };
                }
            }
        });

        if (nearestStopRequired) {
            return nearestStopRequired;
        }

        return { shouldStop: false, distance: Infinity, intersection: null };
    }

    /**
     * Determine approach direction based on position and heading
     */
    getApproachDirection(vehiclePos, intersectionPos, heading) {
        const dx = intersectionPos.x - vehiclePos.x;
        const dz = intersectionPos.z - vehiclePos.z;

        // Determine primary approach direction
        if (Math.abs(dx) > Math.abs(dz)) {
            return dx > 0 ? 'west' : 'east';
        } else {
            return dz > 0 ? 'south' : 'north';
        }
    }

    /**
     * Calculate stop position before intersection
     */
    getStopPosition(intersectionPos, approachDirection) {
        const stopDistance = 8; // Distance before intersection center

        switch (approachDirection) {
            case 'north':
                return { x: intersectionPos.x, z: intersectionPos.z + stopDistance };
            case 'south':
                return { x: intersectionPos.x, z: intersectionPos.z - stopDistance };
            case 'east':
                return { x: intersectionPos.x - stopDistance, z: intersectionPos.z };
            case 'west':
                return { x: intersectionPos.x + stopDistance, z: intersectionPos.z };
            default:
                return intersectionPos;
        }
    }

    /**
     * Check if pedestrian walk signal is active
     * @param {Object} crosswalkPosition
     * @returns {boolean}
     */
    isPedestrianWalkSignal(crosswalkPosition) {
        // Find nearest intersection
        let nearestLight = null;
        let minDist = Infinity;

        this.trafficLights.forEach(light => {
            const pos = light.getPosition();
            const dist = Math.sqrt(
                Math.pow(pos.x - crosswalkPosition.x, 2) +
                Math.pow(pos.z - crosswalkPosition.z, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearestLight = light;
            }
        });

        if (!nearestLight || minDist > 20) return true; // No nearby light, allow crossing

        // Pedestrian walk during all-red phases
        const phase = nearestLight.phases[nearestLight.currentPhaseIndex];
        return phase.ns === 'red' && phase.ew === 'red';
    }

    /**
     * Get traffic light by intersection ID
     */
    getLight(intersectionId) {
        return this.trafficLights.get(intersectionId);
    }

    /**
     * Get all traffic lights
     */
    getAllLights() {
        return Array.from(this.trafficLights.values());
    }

    /**
     * Set night mode for all lights
     */
    setNightMode(isNight) {
        this.isNightMode = isNight;
        this.trafficLights.forEach(light => {
            light.isNightMode = isNight;
            light.updateLightColors();
        });
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.trafficLights.forEach(light => {
            light.destroy();
        });
        this.trafficLights.clear();
    }
}
