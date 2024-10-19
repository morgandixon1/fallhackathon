"use strict";
// generateHTML.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateHTML = generateHTML;
const generateStyles_1 = require("./generateStyles");
const generateScripts_1 = require("./generateScripts");
const helpers_1 = require("../utils/helpers");
const vscode = __importStar(require("vscode"));
function generateHTML(webview, extensionUri, files, savedPositions, savedZoom) {
    console.log('Generating webview content');
    // Sanitize each file's content
    const sanitizedFiles = files.map(file => (Object.assign(Object.assign({}, file), { content: (0, helpers_1.sanitizeContent)(file.content) })));
    const nonce = getNonce();
    // Get URIs for local resources
    const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'styles.css'));
    const highlightJsUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'highlight.min.js'));
    const highlightCssUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'default.min.css'));
    const styles = (0, generateStyles_1.generateStyles)(nonce, stylesUri, highlightCssUri);
    const scripts = (0, generateScripts_1.generateScripts)(nonce, savedZoom);
    // Inject data using script tags with type="application/json"
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="
                default-src 'none';
                img-src ${webview.cspSource} blob:;
                script-src 'nonce-${nonce}';
                style-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Repository File Canvas</title>
            ${styles}
        </head>
        <body>
            <div class="scroll-area">
                <div class="canvas-container" id="canvasContainer">
                    <!-- Files will be dynamically inserted here -->
                </div>
            </div>
            <!-- Zoom Controls -->
            <div id="zoomControls">
                <button id="zoomIn">Zoom In</button>
                <button id="zoomOut">Zoom Out</button>
            </div>
            <!-- Debug and Message Elements -->
            <div id="debug"></div>
            <div id="message"></div>
            <!-- Toggle Debug Button -->
            <button id="toggleDebug">Show Debug</button>
            <!-- Data Scripts -->
            <script id="fileData" type="application/json">${JSON.stringify(sanitizedFiles)}</script>
            <script id="savedPositionsData" type="application/json">${JSON.stringify(savedPositions)}</script>
            <!-- Highlight.js JS -->
            <script nonce="${nonce}" src="${highlightJsUri}"></script>
            <script nonce="${nonce}">
                hljs.highlightAll();
            </script>
            ${scripts}
        </body>
        </html>
    `;
    return html;
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[]|\\:;"\'<>,.?/~`';
    for (let i = 0; i < 64; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
