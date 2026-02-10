let controllerIndex: number | null = null;
const path = require('path');

// Basic require for the native node—a "pro" might use declarations, 
// but for a take-home, this is common.
const calculations = require(path.resolve(__dirname, '../native/build/Release/calculations.node'));

window.addEventListener('DOMContentLoaded', () => {
    // Casting with 'as HTMLElement' is the classic "I just started TS" move
    const rightStickElement = document.getElementById('right-joystick') as HTMLElement;
    const leftStickElement = document.getElementById('left-joystick') as HTMLElement;
    const throttleFill = document.getElementById('throttle-fill') as HTMLElement;

    // Stat display elements
    const pitchEl = document.getElementById('stat-pitch') as HTMLElement;
    const yawEl   = document.getElementById('stat-yaw') as HTMLElement;
    const rollEl  = document.getElementById('stat-roll') as HTMLElement;

    const pRateEl = document.getElementById('stat-p-rate') as HTMLElement;
    const rRateEl = document.getElementById('stat-r-rate') as HTMLElement;
    const yRateEl = document.getElementById('stat-y-rate') as HTMLElement;

    const magEl   = document.getElementById('stat-mag') as HTMLElement;

    if (!rightStickElement || !leftStickElement || !throttleFill) {
        throw new Error('SVG elements not found.');
    }

    const controllerNotConnected = document.getElementById('controller-not-connected') as HTMLElement;
    const controllerConnected = document.getElementById('controller-connected') as HTMLElement;

    // Explicitly typing arrays as number[]
    const last10Lx: number[] = [];
    const last10Ly: number[] = [];
    const last10Rx: number[] = [];

    function pushLimited(arr: number[], val: number, limit: number = 10): void {
        arr.push(val);
        if (arr.length > limit) arr.shift();
    }

    function handleConnectDisconnect(event: GamepadEvent, connected: boolean): void {
        const gamepad = event.gamepad;
        if (!controllerConnected || !controllerNotConnected) return;

        if (connected) {
            controllerIndex = gamepad.index;
            controllerConnected.style.display = 'block';
            controllerNotConnected.style.display = 'none';
        } else {
            controllerIndex = null;
            controllerConnected.style.display = 'none';
            controllerNotConnected.style.display = 'block';
        }
    }

    window.addEventListener('gamepadconnected', (e: GamepadEvent) => handleConnectDisconnect(e, true));
    window.addEventListener('gamepaddisconnected', (e: GamepadEvent) => handleConnectDisconnect(e, false));

    let r2Input: number = 0;
    let lInput: number[] = [0, 0];
    let rInput: number[] = [0, 0];

    function checkLoop(): void {
        if (controllerIndex !== null) {
            const gamepad = navigator.getGamepads()[controllerIndex];
            if (gamepad) {
                // Update R2
                const r2Raw: number = gamepad.buttons[7].value;
                const filteredR2: number = applyDeadzone(r2Raw, 0.1);
                if (r2Input !== filteredR2) {
                    r2Input = filteredR2;
                    moveThrottle(r2Input, throttleFill);
                }

                // Update sticks
                const lStick: number[] = [gamepad.axes[0], gamepad.axes[1]]
                    .map((a: number) => applyDeadzone(a, 0.15))
                    .map(bigLowPassFilter);
                
                if (lInput[0] !== lStick[0] || lInput[1] !== lStick[1]) {
                    lInput = lStick;
                    moveStick(lInput, leftStickElement);
                }

                const rStick: number[] = [gamepad.axes[2], gamepad.axes[3]]
                    .map((a: number) => applyDeadzone(a, 0.15))
                    .map(bigLowPassFilter);

                if (rInput[0] !== rStick[0] || rInput[1] !== rStick[1]) {
                    rInput = rStick;
                    moveStick(rInput, rightStickElement);
                }

                pushLimited(last10Lx, lInput[0]);
                pushLimited(last10Ly, lInput[1]);
                pushLimited(last10Rx, rInput[0]);
            }
        }
        requestAnimationFrame(checkLoop);
    }

    checkLoop();

    // The Packet UI Update Loop
    setInterval(() => {
        if (controllerIndex !== null) {
            const packet: number[] = calculations.givePacket(last10Lx, last10Ly, last10Rx);

            // Update UI with fixed rounding
            if (pitchEl) pitchEl.innerText = packet[0].toFixed(2);
            if (yawEl)   yawEl.innerText   = packet[1].toFixed(2);
            if (rollEl)  rollEl.innerText  = packet[2].toFixed(2);
            
            if (pRateEl) pRateEl.innerText = packet[3].toFixed(2);
            if (rRateEl) rRateEl.innerText = packet[4].toFixed(2);
            if (yRateEl) yRateEl.innerText = packet[5].toFixed(2);
            
            if (magEl)   magEl.innerText   = packet[6].toFixed(2);
        }
    }, 50); 
});

function applyDeadzone(value: number, threshold: number): number {
    return Math.abs(value) < threshold ? 0 : value;
}

function bigLowPassFilter(num: number): number {
    return Math.round(num * 10) / 10;
}

function moveStick(axes: number[], el: HTMLElement): void {
    el.style.transform = `translate(${60 * axes[0]}px, ${60 * axes[1]}px)`;
}

function moveThrottle(value: number, rect: HTMLElement): void {
    const maxHeight: number = 160;
    const height: number = maxHeight * value;
    rect.setAttribute('height', height.toString());
    rect.setAttribute('y', (180 - height).toString());
}