import * as THREE from 'three';

export class Environment {
    constructor(scene, world, isNightMode = false) {
        this.scene = scene;
        this.world = world;
        this.isNightMode = isNightMode;
        this.obstacles = []; // Store obstacles for collision detection
    }

    async create() {
        this.createLighting();
        this.createGround();
        this.createRoad();
        this.createBuildings();
        this.createTrees();
        this.createDecorations();
        this.createSkybox();
    }

    getObstacles() {
        return this.obstacles;
    }

    createLighting() {
        if (this.isNightMode) {
            // Night mode lighting - MUCH brighter so everything is visible
            const ambientLight = new THREE.AmbientLight(0x8899cc, 2.5);
            this.scene.add(ambientLight);

            // Moonlight - very bright
            const moonLight = new THREE.DirectionalLight(0xaabbff, 2.0);
            moonLight.position.set(-50, 100, 50);
            moonLight.castShadow = true;

            moonLight.shadow.mapSize.width = 2048;
            moonLight.shadow.mapSize.height = 2048;
            moonLight.shadow.camera.near = 0.5;
            moonLight.shadow.camera.far = 500;
            moonLight.shadow.camera.left = -100;
            moonLight.shadow.camera.right = 100;
            moonLight.shadow.camera.top = 100;
            moonLight.shadow.camera.bottom = -100;

            this.scene.add(moonLight);

            // Hemisphere light - much brighter
            const hemisphereLight = new THREE.HemisphereLight(0x8899cc, 0x445566, 1.5);
            this.scene.add(hemisphereLight);

            // Extra fill light to ensure visibility
            const fillLight = new THREE.DirectionalLight(0x6677aa, 1.0);
            fillLight.position.set(50, 50, -50);
            this.scene.add(fillLight);
        } else {
            // Day mode lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
            this.scene.add(ambientLight);

            // Sunlight
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(50, 100, 50);
            directionalLight.castShadow = true;

            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -100;
            directionalLight.shadow.camera.right = 100;
            directionalLight.shadow.camera.top = 100;
            directionalLight.shadow.camera.bottom = -100;

            this.scene.add(directionalLight);

            // Hemisphere light
            const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3d5c5c, 0.6);
            this.scene.add(hemisphereLight);
        }
    }

    createGround() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(500, 500, 50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x3d8c40,
            roughness: 0.9,
            metalness: 0
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Create physics ground
        this.world.createGroundCollider(500, 500);
    }

    createRoad() {
        const roadMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8,
            metalness: 0.1
        });

        const lineMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.5
        });

        // Main circular road
        const roadWidth = 8;
        const roadRadius = 40;
        const roadSegments = 64;

        // Create road ring
        const roadShape = new THREE.Shape();
        roadShape.absarc(0, 0, roadRadius + roadWidth / 2, 0, Math.PI * 2, false);
        const holePath = new THREE.Path();
        holePath.absarc(0, 0, roadRadius - roadWidth / 2, 0, Math.PI * 2, true);
        roadShape.holes.push(holePath);

        const roadGeometry = new THREE.ShapeGeometry(roadShape, roadSegments);
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01;
        road.receiveShadow = true;
        this.scene.add(road);

        // Road center line (dashed)
        const centerLineGeometry = new THREE.RingGeometry(roadRadius - 0.1, roadRadius + 0.1, roadSegments);
        const centerLine = new THREE.Mesh(centerLineGeometry, lineMaterial);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.02;
        this.scene.add(centerLine);

        // Straight road from center to loop
        const straightRoadGeometry = new THREE.PlaneGeometry(roadWidth, roadRadius);
        const straightRoad = new THREE.Mesh(straightRoadGeometry, roadMaterial);
        straightRoad.rotation.x = -Math.PI / 2;
        straightRoad.position.set(0, 0.01, roadRadius / 2);
        straightRoad.receiveShadow = true;
        this.scene.add(straightRoad);

        // Cross road
        const crossRoadGeometry = new THREE.PlaneGeometry(roadWidth, roadRadius * 2);
        const crossRoad = new THREE.Mesh(crossRoadGeometry, roadMaterial);
        crossRoad.rotation.x = -Math.PI / 2;
        crossRoad.rotation.z = Math.PI / 2;
        crossRoad.position.set(0, 0.01, 0);
        crossRoad.receiveShadow = true;
        this.scene.add(crossRoad);
    }

    createBuildings() {
        const buildingColors = [0xff6b35, 0x4ecdc4, 0xffe66d, 0x95e1d3, 0xf38181];

        // Use fixed sizes for consistent collision detection
        const buildings = [
            { x: 60, z: 60, width: 10, depth: 10, height: 20 },
            { x: -60, z: 60, width: 12, depth: 8, height: 25 },
            { x: 60, z: -60, width: 8, depth: 12, height: 18 },
            { x: -60, z: -60, width: 10, depth: 10, height: 22 },
            { x: 0, z: 80, width: 8, depth: 8, height: 15 },
            { x: 80, z: 0, width: 12, depth: 12, height: 28 },
            { x: -80, z: 0, width: 10, depth: 10, height: 24 },
            { x: 0, z: -80, width: 9, depth: 9, height: 16 },
            { x: 55, z: 55, width: 8, depth: 8, height: 12 },
            { x: -55, z: 55, width: 7, depth: 7, height: 14 },
            { x: 55, z: -55, width: 8, depth: 8, height: 10 },
            { x: -55, z: -55, width: 9, depth: 9, height: 13 }
        ];

        buildings.forEach((bldg, index) => {
            const { x, z, width, depth, height } = bldg;

            const buildingMaterial = new THREE.MeshStandardMaterial({
                color: buildingColors[index % buildingColors.length],
                roughness: 0.7,
                metalness: 0.1
            });

            const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
            const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
            building.position.set(x, height / 2, z);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);

            // Store obstacle for collision detection
            this.obstacles.push({ x, z, width, depth });

            // Windows
            this.addWindows(building, width, height, depth);
        });
    }

    addWindows(building, width, height, depth) {
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: this.isNightMode ? 0xffee99 : 0x87ceeb,
            emissive: this.isNightMode ? 0xffcc66 : 0x444477,
            emissiveIntensity: this.isNightMode ? 5.0 : 0.3,
            roughness: 0.2,
            metalness: 0.8
        });

        const windowWidth = 0.8;
        const windowHeight = 1.2;
        const windowDepth = 0.1;

        const rows = Math.floor(height / 3);
        const cols = Math.floor(width / 2);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Front windows
                const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);

                const x = (col - (cols - 1) / 2) * 2;
                const y = row * 3 - height / 2 + 2;
                const z = depth / 2 + 0.05;

                windowMesh.position.set(x, y, z);
                building.add(windowMesh);

                // Back windows
                const backWindow = windowMesh.clone();
                backWindow.position.z = -z;
                building.add(backWindow);
            }
        }
    }

    createTrees() {
        const treePositions = [];

        // Generate random tree positions avoiding roads
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 150;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;

            // Avoid road areas
            const distFromCenter = Math.sqrt(x * x + z * z);
            if (distFromCenter < 35 || (distFromCenter > 32 && distFromCenter < 48)) continue;
            if (Math.abs(x) < 5 && z > -50 && z < 50) continue;
            if (Math.abs(z) < 5 && x > -50 && x < 50) continue;

            treePositions.push({ x, z });
        }

        treePositions.forEach(pos => {
            this.createTree(pos.x, pos.z);
        });
    }

    createTree(x, z) {
        const tree = new THREE.Group();

        // Trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.9
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1;
        trunk.castShadow = true;
        tree.add(trunk);

        // Foliage (multiple cones for a stylized look)
        const foliageMaterial = new THREE.MeshStandardMaterial({
            color: 0x228b22,
            roughness: 0.8
        });

        const foliageGeometry1 = new THREE.ConeGeometry(2, 3, 8);
        const foliage1 = new THREE.Mesh(foliageGeometry1, foliageMaterial);
        foliage1.position.y = 3.5;
        foliage1.castShadow = true;
        tree.add(foliage1);

        const foliageGeometry2 = new THREE.ConeGeometry(1.5, 2.5, 8);
        const foliage2 = new THREE.Mesh(foliageGeometry2, foliageMaterial);
        foliage2.position.y = 5;
        foliage2.castShadow = true;
        tree.add(foliage2);

        const foliageGeometry3 = new THREE.ConeGeometry(1, 2, 8);
        const foliage3 = new THREE.Mesh(foliageGeometry3, foliageMaterial);
        foliage3.position.y = 6.2;
        foliage3.castShadow = true;
        tree.add(foliage3);

        tree.position.set(x, 0, z);

        // Random rotation and scale variation
        tree.rotation.y = Math.random() * Math.PI * 2;
        const scale = 0.7 + Math.random() * 0.6;
        tree.scale.set(scale, scale, scale);

        this.scene.add(tree);

        // Add tree as obstacle (trunk collision)
        this.obstacles.push({ x, z, width: 1.5, depth: 1.5 });
    }

    createDecorations() {
        // Lamp posts along roads
        const lampPositions = [];
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const radius = 44;
            lampPositions.push({
                x: Math.cos(angle) * radius,
                z: Math.sin(angle) * radius
            });
        }

        lampPositions.forEach(pos => {
            this.createLampPost(pos.x, pos.z);
        });

        // Benches
        this.createBench(10, 10);
        this.createBench(-10, 10);
        this.createBench(10, -10);
        this.createBench(-10, -10);

        // Signs
        this.createSign(5, 20, 'Welcome!');
        this.createSign(-5, -20, 'Sayush Kamat');
    }

    createLampPost(x, z) {
        const post = new THREE.Group();

        // Pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 4, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.y = 2;
        pole.castShadow = true;
        post.add(pole);

        // Lamp head - very bright at night
        const headGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffcc,
            emissive: 0xffffaa,
            emissiveIntensity: this.isNightMode ? 10 : 0.5,
            roughness: 0.3
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 4.2;
        post.add(head);

        // Point light - very bright at night
        const lightIntensity = this.isNightMode ? 20 : 0.5;
        const lightDistance = this.isNightMode ? 60 : 15;
        const light = new THREE.PointLight(0xffffcc, lightIntensity, lightDistance);
        light.position.y = 4.2;
        post.add(light);

        post.position.set(x, 0, z);
        this.scene.add(post);
    }

    createBench(x, z) {
        const bench = new THREE.Group();

        const woodMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        });

        const metalMaterial = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });

        // Seat planks
        for (let i = 0; i < 4; i++) {
            const plankGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.2);
            const plank = new THREE.Mesh(plankGeometry, woodMaterial);
            plank.position.set(0, 0.5, i * 0.22 - 0.33);
            plank.castShadow = true;
            bench.add(plank);
        }

        // Back planks
        for (let i = 0; i < 3; i++) {
            const backPlankGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.15);
            const backPlank = new THREE.Mesh(backPlankGeometry, woodMaterial);
            backPlank.position.set(0, 0.75 + i * 0.18, -0.4);
            backPlank.rotation.x = 0.2;
            backPlank.castShadow = true;
            bench.add(backPlank);
        }

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.8);
        const leg1 = new THREE.Mesh(legGeometry, metalMaterial);
        leg1.position.set(-0.6, 0.25, 0);
        leg1.castShadow = true;
        bench.add(leg1);

        const leg2 = new THREE.Mesh(legGeometry, metalMaterial);
        leg2.position.set(0.6, 0.25, 0);
        leg2.castShadow = true;
        bench.add(leg2);

        bench.position.set(x, 0, z);
        bench.rotation.y = Math.atan2(x, z);
        this.scene.add(bench);

        // Physics collider
        this.world.createBoxCollider(x, 0.5, z, 1.5, 1, 0.8);
    }

    createSign(x, z, text) {
        const sign = new THREE.Group();

        // Post
        const postGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
        const postMaterial = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.8
        });
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.y = 1.5;
        post.castShadow = true;
        sign.add(post);

        // Sign board
        const boardGeometry = new THREE.BoxGeometry(2, 1, 0.1);
        const boardMaterial = new THREE.MeshStandardMaterial({
            color: 0xff6b35,
            roughness: 0.5
        });
        const board = new THREE.Mesh(boardGeometry, boardMaterial);
        board.position.y = 3.2;
        board.castShadow = true;
        sign.add(board);

        // Text (using canvas texture)
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff6b35';
        ctx.fillRect(0, 0, 256, 128);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Amatic SC, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 64);

        const textTexture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true
        });
        const textGeometry = new THREE.PlaneGeometry(1.8, 0.9);
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 3.2, 0.06);
        sign.add(textMesh);

        sign.position.set(x, 0, z);
        sign.rotation.y = Math.atan2(-x, -z);
        this.scene.add(sign);
    }

    createSkybox() {
        // Simple gradient sky using a large sphere
        const skyGeometry = new THREE.SphereGeometry(400, 32, 32);

        let topColor, bottomColor;
        if (this.isNightMode) {
            topColor = new THREE.Color(0x0a1030);
            bottomColor = new THREE.Color(0x1a2050);
        } else {
            topColor = new THREE.Color(0x0077ff);
            bottomColor = new THREE.Color(0x87ceeb);
        }

        const skyMaterial = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: topColor },
                bottomColor: { value: bottomColor },
                offset: { value: 20 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);

        if (this.isNightMode) {
            // Add stars at night
            this.createStars();
            // Add moon
            this.createMoon();
        } else {
            // Add clouds during the day
            this.createClouds();
        }
    }

    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 2,
            sizeAttenuation: true
        });

        const starsVertices = [];
        for (let i = 0; i < 2000; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 350 + Math.random() * 30;

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = Math.abs(radius * Math.cos(phi)); // Only upper hemisphere
            const z = radius * Math.sin(phi) * Math.sin(theta);

            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    createMoon() {
        const moonGeometry = new THREE.SphereGeometry(15, 32, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffee
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(-200, 150, -100);
        this.scene.add(moon);

        // Moon glow - much brighter
        const glowGeometry = new THREE.SphereGeometry(25, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffee,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(moon.position);
        this.scene.add(glow);

        // Outer glow
        const outerGlowGeometry = new THREE.SphereGeometry(40, 32, 32);
        const outerGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xaabbff,
            transparent: true,
            opacity: 0.15
        });
        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.position.copy(moon.position);
        this.scene.add(outerGlow);
    }

    createClouds() {
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 1,
            metalness: 0,
            transparent: true,
            opacity: 0.9
        });

        for (let i = 0; i < 20; i++) {
            const cloud = new THREE.Group();

            // Multiple spheres for fluffy cloud effect
            const numPuffs = 3 + Math.floor(Math.random() * 4);
            for (let j = 0; j < numPuffs; j++) {
                const puffSize = 3 + Math.random() * 5;
                const puffGeometry = new THREE.SphereGeometry(puffSize, 8, 8);
                const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
                puff.position.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 10
                );
                cloud.add(puff);
            }

            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 150;
            const height = 60 + Math.random() * 40;

            cloud.position.set(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );

            this.scene.add(cloud);
        }
    }
}
