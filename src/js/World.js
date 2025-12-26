import RAPIER from '@dimforge/rapier3d-compat';

export class World {
    constructor() {
        this.world = null;
        this.bodies = [];
        this.colliders = [];
    }

    async init() {
        await RAPIER.init();

        const gravity = { x: 0.0, y: -9.81, z: 0.0 };
        this.world = new RAPIER.World(gravity);
    }

    createRigidBody(desc) {
        const body = this.world.createRigidBody(desc);
        this.bodies.push(body);
        return body;
    }

    createCollider(desc, body) {
        const collider = this.world.createCollider(desc, body);
        this.colliders.push(collider);
        return collider;
    }

    createGroundCollider(width, depth) {
        const groundDesc = RAPIER.RigidBodyDesc.fixed();
        const groundBody = this.world.createRigidBody(groundDesc);

        const groundColliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, 0.1, depth / 2)
            .setFriction(0.8)
            .setRestitution(0.1);
        this.world.createCollider(groundColliderDesc, groundBody);

        return groundBody;
    }

    createBoxCollider(x, y, z, width, height, depth, isStatic = true) {
        const bodyDesc = isStatic
            ? RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z)
            : RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);

        const body = this.world.createRigidBody(bodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
            .setFriction(0.5)
            .setRestitution(0.3);

        this.world.createCollider(colliderDesc, body);

        return body;
    }

    createCylinderCollider(x, y, z, radius, height, isStatic = true) {
        const bodyDesc = isStatic
            ? RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z)
            : RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);

        const body = this.world.createRigidBody(bodyDesc);

        const colliderDesc = RAPIER.ColliderDesc.cylinder(height / 2, radius)
            .setFriction(0.5)
            .setRestitution(0.3);

        this.world.createCollider(colliderDesc, body);

        return body;
    }

    update(delta) {
        if (this.world) {
            this.world.step();
        }
    }

    getWorld() {
        return this.world;
    }
}
