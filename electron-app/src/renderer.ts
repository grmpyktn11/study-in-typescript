const rightStickElement = document.querySelector<SVGCircleElement>('#right-circle');
const leftStickElement = document.querySelector<SVGCircleElement>('#left-circle');

if (!rightStickElement || !leftStickElement) {
    throw new Error("SVG circle elements not found!");
}


// Sample framework function
function handleStick(stick: SVGCircleElement): void {
    stick.setAttribute("cy", "10");
}

// Example usage:
// handleStick(rightStickElement);
// handleStick(leftStickElement);
