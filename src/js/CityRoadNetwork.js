import * as THREE from 'three';

/**
 * CityRoadNetwork - Defines the city layout with roads, intersections, and waypoints
 * Provides data for road rendering and NPC navigation
 */
export class CityRoadNetwork {
    constructor() {
        // City dimensions
        this.citySize = 300;
        this.halfCity = this.citySize / 2;

        // Road properties
        this.mainRoadWidth = 10;
        this.sideRoadWidth = 6;
        this.highwayWidth = 14;
        this.laneWidth = 2.5;

        // Storage
        this.segments = [];
        this.intersections = [];
        this.waypoints = new Map();
        this.lanes = [];

        // Build the network
        this.build();
    }

    build() {
        this.createMainRoads();
        this.createSideStreets();
        this.createHighwayLoop();
        this.createCurvedConnectors();
        this.createIntersections();
        this.generateWaypoints();
    }

    createMainRoads() {
        // Horizontal main roads (4 lanes each)
        const horizontalPositions = [-80, 0, 80];
        horizontalPositions.forEach((z, index) => {
            this.segments.push({
                id: `main-h${index}`,
                type: 'main',
                start: { x: -120, z: z },
                end: { x: 120, z: z },
                width: this.mainRoadWidth,
                lanes: 4,
                speedLimit: 50,
                isCurved: false,
                direction: 'horizontal'
            });
        });

        // Vertical main roads (4 lanes each)
        const verticalPositions = [-80, 0, 80];
        verticalPositions.forEach((x, index) => {
            this.segments.push({
                id: `main-v${index}`,
                type: 'main',
                start: { x: x, z: -120 },
                end: { x: x, z: 120 },
                width: this.mainRoadWidth,
                lanes: 4,
                speedLimit: 50,
                isCurved: false,
                direction: 'vertical'
            });
        });
    }

    createSideStreets() {
        // Side streets between main roads (2 lanes each)
        const sidePositionsH = [-40, 40];
        const sidePositionsV = [-40, 40];

        // Horizontal side streets
        sidePositionsH.forEach((z, index) => {
            this.segments.push({
                id: `side-h${index}`,
                type: 'side',
                start: { x: -80, z: z },
                end: { x: 80, z: z },
                width: this.sideRoadWidth,
                lanes: 2,
                speedLimit: 30,
                isCurved: false,
                direction: 'horizontal'
            });
        });

        // Vertical side streets
        sidePositionsV.forEach((x, index) => {
            this.segments.push({
                id: `side-v${index}`,
                type: 'side',
                start: { x: x, z: -80 },
                end: { x: x, z: 80 },
                width: this.sideRoadWidth,
                lanes: 2,
                speedLimit: 30,
                isCurved: false,
                direction: 'vertical'
            });
        });
    }

    createHighwayLoop() {
        // Highway loop around the city (curved segments)
        const radius = 140;
        const numSegments = 16;

        for (let i = 0; i < numSegments; i++) {
            const angle1 = (i / numSegments) * Math.PI * 2;
            const angle2 = ((i + 1) / numSegments) * Math.PI * 2;

            this.segments.push({
                id: `highway-${i}`,
                type: 'highway',
                start: {
                    x: Math.cos(angle1) * radius,
                    z: Math.sin(angle1) * radius
                },
                end: {
                    x: Math.cos(angle2) * radius,
                    z: Math.sin(angle2) * radius
                },
                width: this.highwayWidth,
                lanes: 4,
                speedLimit: 80,
                isCurved: true,
                curveCenter: { x: 0, z: 0 },
                curveRadius: radius,
                curveStartAngle: angle1,
                curveEndAngle: angle2,
                direction: 'circular'
            });
        }
    }

    createCurvedConnectors() {
        // Curved roads connecting highway to main roads
        const connectorConfigs = [
            { from: { x: 120, z: 0 }, to: { x: 140, z: 0 }, control: { x: 135, z: 10 } },
            { from: { x: -120, z: 0 }, to: { x: -140, z: 0 }, control: { x: -135, z: -10 } },
            { from: { x: 0, z: 120 }, to: { x: 0, z: 140 }, control: { x: 10, z: 135 } },
            { from: { x: 0, z: -120 }, to: { x: 0, z: -140 }, control: { x: -10, z: -135 } },
        ];

        connectorConfigs.forEach((config, index) => {
            this.segments.push({
                id: `connector-${index}`,
                type: 'connector',
                start: config.from,
                end: config.to,
                controlPoint: config.control,
                width: this.mainRoadWidth,
                lanes: 2,
                speedLimit: 40,
                isCurved: true,
                curveType: 'bezier',
                direction: 'connector'
            });
        });
    }

    createIntersections() {
        // Main road intersections (traffic lights)
        const mainPositions = [-80, 0, 80];

        mainPositions.forEach((x, xi) => {
            mainPositions.forEach((z, zi) => {
                this.intersections.push({
                    id: `intersection-${xi}-${zi}`,
                    position: { x, z },
                    type: 'four-way',
                    hasTrafficLight: true,
                    connectedRoads: [
                        `main-h${zi}`,
                        `main-v${xi}`
                    ],
                    size: this.mainRoadWidth
                });
            });
        });

        // Side street intersections (smaller, some with lights)
        const sideH = [-40, 40];
        const sideV = [-40, 40];

        sideH.forEach((z, zi) => {
            sideV.forEach((x, xi) => {
                this.intersections.push({
                    id: `side-intersection-${xi}-${zi}`,
                    position: { x, z },
                    type: 'four-way',
                    hasTrafficLight: false, // Yield intersections
                    connectedRoads: [
                        `side-h${zi}`,
                        `side-v${xi}`
                    ],
                    size: this.sideRoadWidth
                });
            });
        });

        // Main-side intersections
        mainPositions.forEach((mainPos, mi) => {
            sideH.forEach((sideZ, si) => {
                // Vertical main road crossing horizontal side street
                this.intersections.push({
                    id: `cross-v${mi}-sh${si}`,
                    position: { x: mainPos, z: sideZ },
                    type: 'four-way',
                    hasTrafficLight: true,
                    connectedRoads: [`main-v${mi}`, `side-h${si}`],
                    size: this.mainRoadWidth
                });
            });

            sideV.forEach((sideX, si) => {
                // Horizontal main road crossing vertical side street
                this.intersections.push({
                    id: `cross-h${mi}-sv${si}`,
                    position: { x: sideX, z: mainPos },
                    type: 'four-way',
                    hasTrafficLight: true,
                    connectedRoads: [`main-h${mi}`, `side-v${si}`],
                    size: this.mainRoadWidth
                });
            });
        });
    }

    generateWaypoints() {
        // Generate waypoints along each road segment for NPC navigation
        const waypointSpacing = 8;

        this.segments.forEach(segment => {
            const waypoints = [];

            if (segment.isCurved && segment.curveRadius) {
                // Curved road (highway loop)
                const arcLength = Math.abs(segment.curveEndAngle - segment.curveStartAngle) * segment.curveRadius;
                const numPoints = Math.max(3, Math.ceil(arcLength / waypointSpacing));

                for (let i = 0; i <= numPoints; i++) {
                    const t = i / numPoints;
                    const angle = segment.curveStartAngle + t * (segment.curveEndAngle - segment.curveStartAngle);

                    // Generate waypoints for each lane
                    for (let lane = 0; lane < segment.lanes; lane++) {
                        const laneOffset = (lane - (segment.lanes - 1) / 2) * this.laneWidth;
                        const r = segment.curveRadius + laneOffset;

                        const wp = {
                            id: `${segment.id}-wp${i}-lane${lane}`,
                            position: {
                                x: Math.cos(angle) * r + (segment.curveCenter?.x || 0),
                                z: Math.sin(angle) * r + (segment.curveCenter?.z || 0)
                            },
                            lane: lane,
                            segmentId: segment.id,
                            direction: lane < segment.lanes / 2 ? 1 : -1
                        };
                        waypoints.push(wp);
                        this.waypoints.set(wp.id, wp);
                    }
                }
            } else {
                // Straight road
                const dx = segment.end.x - segment.start.x;
                const dz = segment.end.z - segment.start.z;
                const length = Math.sqrt(dx * dx + dz * dz);
                const numPoints = Math.max(2, Math.ceil(length / waypointSpacing));

                // Perpendicular direction for lane offsets
                const perpX = -dz / length;
                const perpZ = dx / length;

                for (let i = 0; i <= numPoints; i++) {
                    const t = i / numPoints;

                    for (let lane = 0; lane < segment.lanes; lane++) {
                        const laneOffset = (lane - (segment.lanes - 1) / 2) * this.laneWidth;

                        const wp = {
                            id: `${segment.id}-wp${i}-lane${lane}`,
                            position: {
                                x: segment.start.x + t * dx + perpX * laneOffset,
                                z: segment.start.z + t * dz + perpZ * laneOffset
                            },
                            lane: lane,
                            segmentId: segment.id,
                            direction: lane < segment.lanes / 2 ? 1 : -1
                        };
                        waypoints.push(wp);
                        this.waypoints.set(wp.id, wp);
                    }
                }
            }

            // Store lane info
            for (let lane = 0; lane < segment.lanes; lane++) {
                this.lanes.push({
                    id: `${segment.id}-lane${lane}`,
                    segmentId: segment.id,
                    laneIndex: lane,
                    direction: lane < segment.lanes / 2 ? 1 : -1,
                    speedLimit: segment.speedLimit,
                    waypoints: waypoints.filter(w => w.lane === lane).map(w => w.id)
                });
            }
        });
    }

    // Get all road segments
    getSegments() {
        return this.segments;
    }

    // Get all intersections
    getIntersections() {
        return this.intersections;
    }

    // Get intersections with traffic lights
    getTrafficLightIntersections() {
        return this.intersections.filter(i => i.hasTrafficLight);
    }

    // Get a random spawn point for NPC
    getRandomSpawnPoint() {
        const drivableLanes = this.lanes.filter(l =>
            l.segmentId.startsWith('main') || l.segmentId.startsWith('highway')
        );
        const lane = drivableLanes[Math.floor(Math.random() * drivableLanes.length)];
        const waypointIds = lane.waypoints;
        const startWpId = waypointIds[Math.floor(Math.random() * (waypointIds.length - 1))];
        const wp = this.waypoints.get(startWpId);

        return {
            position: { ...wp.position },
            lane: lane,
            waypointIndex: waypointIds.indexOf(startWpId),
            direction: lane.direction
        };
    }

    // Get waypoint by ID
    getWaypoint(id) {
        return this.waypoints.get(id);
    }

    // Get next waypoint in lane
    getNextWaypoint(currentWpId, direction = 1) {
        const wp = this.waypoints.get(currentWpId);
        if (!wp) return null;

        const lane = this.lanes.find(l => l.id === `${wp.segmentId}-lane${wp.lane}`);
        if (!lane) return null;

        const currentIndex = lane.waypoints.indexOf(currentWpId);
        const nextIndex = currentIndex + direction;

        if (nextIndex < 0 || nextIndex >= lane.waypoints.length) {
            // End of lane - need to find connecting lane
            return this.findConnectingWaypoint(wp, direction);
        }

        return this.waypoints.get(lane.waypoints[nextIndex]);
    }

    // Find a connecting waypoint at intersection
    findConnectingWaypoint(currentWp, direction) {
        // Find nearby intersection
        const nearbyIntersection = this.intersections.find(inter => {
            const dist = Math.sqrt(
                Math.pow(inter.position.x - currentWp.position.x, 2) +
                Math.pow(inter.position.z - currentWp.position.z, 2)
            );
            return dist < 15;
        });

        if (!nearbyIntersection) {
            // Loop back to start of current lane (for highway)
            const lane = this.lanes.find(l => l.id === `${currentWp.segmentId}-lane${currentWp.lane}`);
            if (lane && lane.waypoints.length > 0) {
                const loopIndex = direction > 0 ? 0 : lane.waypoints.length - 1;
                return this.waypoints.get(lane.waypoints[loopIndex]);
            }
            return null;
        }

        // Find a random connecting lane
        const connectedLanes = this.lanes.filter(l => {
            if (l.segmentId === currentWp.segmentId) return false;

            const segment = this.segments.find(s => s.id === l.segmentId);
            if (!segment) return false;

            // Check if segment connects to intersection
            const distToStart = Math.sqrt(
                Math.pow(nearbyIntersection.position.x - segment.start.x, 2) +
                Math.pow(nearbyIntersection.position.z - segment.start.z, 2)
            );
            const distToEnd = Math.sqrt(
                Math.pow(nearbyIntersection.position.x - segment.end.x, 2) +
                Math.pow(nearbyIntersection.position.z - segment.end.z, 2)
            );

            return distToStart < 15 || distToEnd < 15;
        });

        if (connectedLanes.length === 0) return null;

        // Pick a random connecting lane
        const nextLane = connectedLanes[Math.floor(Math.random() * connectedLanes.length)];
        const wpId = nextLane.direction > 0 ? nextLane.waypoints[0] : nextLane.waypoints[nextLane.waypoints.length - 1];

        return this.waypoints.get(wpId);
    }

    // Check if position is on a road
    isOnRoad(x, z) {
        for (const segment of this.segments) {
            if (segment.isCurved && segment.curveRadius) {
                // Check distance from center for curved roads
                const dist = Math.sqrt(x * x + z * z);
                if (Math.abs(dist - segment.curveRadius) < segment.width / 2 + 2) {
                    return true;
                }
            } else {
                // Check for straight roads
                const dx = segment.end.x - segment.start.x;
                const dz = segment.end.z - segment.start.z;
                const length = Math.sqrt(dx * dx + dz * dz);

                // Vector from start to point
                const px = x - segment.start.x;
                const pz = z - segment.start.z;

                // Project onto road direction
                const t = (px * dx + pz * dz) / (length * length);

                if (t >= -0.1 && t <= 1.1) {
                    // Find closest point on road
                    const closestX = segment.start.x + t * dx;
                    const closestZ = segment.start.z + t * dz;

                    const distToRoad = Math.sqrt(
                        Math.pow(x - closestX, 2) + Math.pow(z - closestZ, 2)
                    );

                    if (distToRoad < segment.width / 2 + 2) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // Get nearest intersection to a position
    getNearestIntersection(x, z) {
        let nearest = null;
        let minDist = Infinity;

        for (const intersection of this.intersections) {
            const dist = Math.sqrt(
                Math.pow(intersection.position.x - x, 2) +
                Math.pow(intersection.position.z - z, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearest = intersection;
            }
        }

        return { intersection: nearest, distance: minDist };
    }

    // Get building placement zones (areas not on roads)
    getBuildingZones() {
        const zones = [];
        const blockSize = 35;
        const padding = 15;

        // Create building zones in grid blocks between roads
        const positions = [-60, -20, 20, 60];

        positions.forEach(x => {
            positions.forEach(z => {
                // Check if this zone is clear of roads
                if (!this.isOnRoad(x, z)) {
                    zones.push({
                        center: { x, z },
                        size: blockSize,
                        maxBuildings: 4
                    });
                }
            });
        });

        return zones;
    }
}
