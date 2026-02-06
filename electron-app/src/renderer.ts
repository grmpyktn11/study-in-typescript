let controllerIndex: number | null = null;

window.addEventListener('DOMContentLoaded', () => {
    // Get SVG elements for the sticks
    const rightStickElement = document.getElementById('right-joystick') as unknown as SVGCircleElement;
    const leftStickElement = document.getElementById('left-joystick') as unknown as SVGCircleElement;
    const throttleFill = document.getElementById('throttle-fill') as unknown as SVGRectElement;

    if (!rightStickElement || !leftStickElement || !throttleFill) {
        throw new Error('SVG circle elements not found, potential Throttle error.');
    }

    console.log('DOM loaded');

    // Cache controller status elements
    const controllerNotConnected = document.getElementById('controller-not-connected') as HTMLElement;
    const controllerConnected = document.getElementById('controller-connected') as HTMLElement;

    // Handle controller connect/disconnect
    function handleConnectDisconnect(event: GamepadEvent, connected: boolean): void {
        const gamepad = event.gamepad;
        if (!controllerConnected || !controllerNotConnected) {
            console.error('Controller status elements not found');
            return;
        }

        if (connected) {
            controllerIndex = gamepad.index;
            controllerConnected.style.display = 'block';
            controllerNotConnected.style.display = 'none';
        } else {
            controllerIndex = null;
            controllerConnected.style.display = 'none';
            controllerNotConnected.style.display = 'block';
        }

        console.log('Controller connection changed:', connected, gamepad);
    }

    window.addEventListener('gamepadconnected', (event: GamepadEvent) => {
        handleConnectDisconnect(event, true);
    });

    window.addEventListener('gamepaddisconnected', (event: GamepadEvent) => {
        handleConnectDisconnect(event, false);
    });

    // Store filtered input values
    let r2Input = 0;
    let lInput: number[] = [0, 0]; // left stick x,y
    let rInput: number[] = [0, 0]; // right stick x,y

    // Main loop for reading controller input
    function checkLoop(): void {
        if (controllerIndex !== null) {
            const gamepad = navigator.getGamepads()[controllerIndex];
            if (gamepad) {
                // Right trigger (R2)
                const r2Raw = gamepad.buttons[7].value;
                const filteredR2 = applyDeadzone(r2Raw, 0.1);
                if (r2Input !== filteredR2) {
                    r2Input = filteredR2;
                    moveThrottle(r2Input, throttleFill);
                    console.log('Right trigger:', r2Input);
                }

                // Left stick
                const lStickX = applyDeadzone(gamepad.axes[0], .15);
                const lStickY = applyDeadzone(gamepad.axes[1], .15);
                const filteredLStick: number[] = [
                    bigLowPassFilter(lStickX),
                    bigLowPassFilter(lStickY)
                ];

                if (lInput[0] !== filteredLStick[0] || lInput[1] !== filteredLStick[1]) {
            
                    lInput = filteredLStick;
                    moveStick(lInput, leftStickElement);
                    console.log('Left stick:', lInput);
                }

                // Right stick
                const rStickX = applyDeadzone(gamepad.axes[2], .15);
                const rStickY = applyDeadzone(gamepad.axes[3], .15);
                const filteredRStick: number[] = [
                    bigLowPassFilter(rStickX),
                    bigLowPassFilter(rStickY)
                ];
                if (rInput[0] !== filteredRStick[0] || rInput[1] !== filteredRStick[1]) {
                    rInput = filteredRStick;
                    moveStick(rInput, rightStickElement)
                    console.log('Right stick:', rInput);
                }
            }
        }

        requestAnimationFrame(checkLoop);
    }

    checkLoop();
});

// Small low-pass filter for triggers
function lowPassFilter(num: number): number {
    return Math.round(num * 100) / 100;
}

// Bigger low-pass filter for sticks
function bigLowPassFilter(num: number): number {
    
    return Math.round(num * 10) / 10;
}

function moveStick(axes: number[], circle: SVGCircleElement): void {
    // Updated for 200x200 SVG with 40px radius outer circle
    circle.style.transform = `translate(${(60 * axes[0])}px, ${60 * axes[1]}px)`;
}

function applyDeadzone(value: number, threshold: number): number {
    return Math.abs(value) < threshold ? 0 : value;
}

function moveThrottle(value: number, rect: SVGRectElement): void {
    // Updated for 200px height SVG with 160px usable height
    const maxHeight = 160;
    const height = maxHeight * value;
    const y = 180 - height;

    rect.setAttribute('height', height.toString());
    rect.setAttribute('y', y.toString());
}

const hello = require('../build/Release/hello');


console.log(hello.sayHello()); // "Hello from C++!"