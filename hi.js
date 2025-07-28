"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var readline = require("readline");
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.question('What is your name? ', function (answer) {
    console.log("Hello, ".concat(answer, "!"));
    rl.close();
});
