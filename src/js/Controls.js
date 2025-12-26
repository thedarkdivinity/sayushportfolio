export class Controls {
    constructor(motorcycle) {
        this.motorcycle = motorcycle;

        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            brake: false
        };

        this.touch = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0
        };

        this.joystick = {
            active: false,
            x: 0,
            y: 0
        };

        this.setupKeyboardControls();
        this.setupTouchControls();
        this.setupMobileControls();
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
    }

    onKeyDown(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                this.keys.brake = true;
                break;
            case 'KeyR':
                this.motorcycle.reset();
                break;
        }
    }

    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'Space':
                this.keys.brake = false;
                break;
        }
    }

    setupTouchControls() {
        const canvas = document.getElementById('webgl-canvas');

        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.touch.active = true;
                this.touch.startX = e.touches[0].clientX;
                this.touch.startY = e.touches[0].clientY;
                this.touch.currentX = e.touches[0].clientX;
                this.touch.currentY = e.touches[0].clientY;
            }
        });

        canvas.addEventListener('touchmove', (e) => {
            if (this.touch.active && e.touches.length === 1) {
                this.touch.currentX = e.touches[0].clientX;
                this.touch.currentY = e.touches[0].clientY;
            }
        });

        canvas.addEventListener('touchend', () => {
            this.touch.active = false;
        });
    }

    setupMobileControls() {
        const joystick = document.getElementById('joystick');
        const joystickHandle = document.getElementById('joystick-handle');
        const brakeBtn = document.getElementById('mobile-brake');

        if (!joystick || !joystickHandle) return;

        const joystickRect = joystick.getBoundingClientRect();
        const maxDistance = joystickRect.width / 2 - 25;

        const handleJoystick = (x, y) => {
            const rect = joystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            let deltaX = x - centerX;
            let deltaY = y - centerY;

            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }

            joystickHandle.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            this.joystick.x = deltaX / maxDistance;
            this.joystick.y = -deltaY / maxDistance;
            this.joystick.active = true;
        };

        const resetJoystick = () => {
            joystickHandle.style.transform = 'translate(0, 0)';
            this.joystick.x = 0;
            this.joystick.y = 0;
            this.joystick.active = false;
        };

        joystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleJoystick(touch.clientX, touch.clientY);
        });

        joystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleJoystick(touch.clientX, touch.clientY);
        });

        joystick.addEventListener('touchend', (e) => {
            e.preventDefault();
            resetJoystick();
        });

        if (brakeBtn) {
            brakeBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys.brake = true;
            });

            brakeBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys.brake = false;
            });
        }
    }

    getInput() {
        // Combine keyboard and joystick input
        let forward = this.keys.forward;
        let backward = this.keys.backward;
        let left = this.keys.left;
        let right = this.keys.right;

        // Mobile joystick input
        if (this.joystick.active) {
            if (this.joystick.y > 0.3) forward = true;
            if (this.joystick.y < -0.3) backward = true;
            if (this.joystick.x < -0.3) left = true;
            if (this.joystick.x > 0.3) right = true;
        }

        // Touch swipe input (for simple touch)
        if (this.touch.active) {
            const deltaX = this.touch.currentX - this.touch.startX;
            const deltaY = this.touch.currentY - this.touch.startY;

            if (deltaY < -30) forward = true;
            if (deltaY > 30) backward = true;
            if (deltaX < -30) left = true;
            if (deltaX > 30) right = true;
        }

        return {
            forward,
            backward,
            left,
            right,
            brake: this.keys.brake
        };
    }
}
