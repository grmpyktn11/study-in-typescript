# Flight Control Simulator

Real-time flight control simulation using gamepad input with C++ native calculations.

## Setup

Install dependencies:
```bash
npm install
```

This runs the postinstall script which builds the native C++ module.

## Run

```bash
npm start
```

Builds TypeScript and starts the Electron app.

## Scripts

- `npm start` - Build and run
- `npm run build` - Compile TypeScript only
- `npm run build:native` - Rebuild C++ module
- `npm run clean` - Delete dist folder

## Usage

Connect a gamepad and run `npm start`. 

- Left stick: pitch/roll
- Right stick: yaw  
- R2: throttle

The display shows current angles, angular rates, and input magnitude.

## How it works

TypeScript reads gamepad input, sends last 10 samples to C++ native module for averaging and rate integration, then displays the results.