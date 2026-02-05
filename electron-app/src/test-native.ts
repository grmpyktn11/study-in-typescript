import * as path from 'path';

// Load the compiled C++ module
const nativeAddon = require(path.join(__dirname, '../native/build/Release/hello.node'));

const greeting = nativeAddon.sayHello("World");
console.log(greeting); 

