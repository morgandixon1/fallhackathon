// generateHTML.ts

import { generateStyles } from './generateStyles';
import { generateScripts } from './generateScripts';
import { sanitizeContent } from '../utils/helpers';
import * as vscode from 'vscode';

export function generateHTML(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
    files: any[],
    savedPositions: { [key: string]: { x: number; y: number } },
    savedZoom: number
): string {
    console.log('Generating webview content');

    // Sanitize each file's content
    const sanitizedFiles = files.map(file => ({
        ...file,
        content: sanitizeContent(file.content)
    }));

    const nonce = getNonce();

    // Get URIs for local resources
    const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'media', 'styles.css')
    );
    const highlightJsUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'media', 'highlight.min.js')
    );
    const highlightCssUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'media', 'default.min.css')
    );

    const styles = generateStyles(nonce, stylesUri, highlightCssUri);
    const scripts = generateScripts(nonce, savedZoom);

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