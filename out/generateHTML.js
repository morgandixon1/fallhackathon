"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHTML = generateHTML;
const generateStyles_1 = require("./generateStyles");
const generateScripts_1 = require("./generateScripts");
function generateHTML(files, // Replace with FileInfo[] if you have defined it elsewhere
savedPositions, savedZoom) {
    console.log('Generating webview content');
    const fileData = JSON.stringify(files);
    const savedPositionsData = JSON.stringify(savedPositions);
    // Define nonce for security
    const nonce = getNonce();
    // Generate CSS styles
    const styles = (0, generateStyles_1.generateStyles)();
    // Generate JavaScript scripts with embedded generateCardHTML
    const scripts = (0, generateScripts_1.generateScripts)(fileData, savedPositionsData, nonce);
    // Assemble the complete HTML with the same nonce
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Repository File Canvas</title>
            ${styles}
        </head>
        <body>
            <div id="controls" style="position: fixed; top: 10px; left: 10px; z-index: 1002;">
                <button id="zoomIn">Zoom In</button>
                <button id="zoomOut">Zoom Out</button>
            </div>
            <button id="toggleDebug" style="position: fixed; top: 10px; right: 10px; z-index: 1001;">Show Debug</button>
            <div id="debug" style="display: none;"></div>
            <div class="scroll-area">
                <div class="canvas-container" id="canvasContainer">
                    <div id="message" class="message"></div>
                    <!-- Cards will be dynamically inserted here -->
                </div>
            </div>
            ${scripts}
        </body>
        </html>
    `;
    return html;
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
