// generateStyles.ts

import * as vscode from 'vscode';

export function generateStyles(
    nonce: string,
    stylesUri: vscode.Uri,
    highlightCssUri: vscode.Uri
): string {
    return `
        <link nonce="${nonce}" rel="stylesheet" href="${stylesUri}">
        <link nonce="${nonce}" rel="stylesheet" href="${highlightCssUri}">
        <style nonce="${nonce}">
            /* Base Styles */
            body {
                margin: 0;
                padding: 0;
                font-family: 'Fira Code', monospace;
                background-color: #1e1e1e;
                color: #d4d4d4;
            }

            .scroll-area {
                height: 100vh;
                overflow: auto;
                cursor: grab;
                background-color: #252526;
                position: relative;
            }
            .scroll-area:active {
                cursor: grabbing;
            }

            .canvas-container {
                position: relative;
                width: 8000px; /* Adjust as needed */
                height: 6000px; /* Adjust as needed */
            }

            /* Card (VSCode Window) Styles */
            .card {
                width: 600px;
                background-color: #1e1e1e;
                border: 1px solid #333;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
                position: absolute;
                border-radius: 5px;
                overflow: hidden;
            }

            /* Window Title Bar */
            .window-title-bar {
                background-color: #3c3c3c;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 10px;
                color: #ffffff;
                user-select: none;
            }

            .window-controls {
                display: flex;
                align-items: center;
            }

            .window-control {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                margin-right: 8px;
                cursor: pointer;
            }

            .window-control.close {
                background-color: #ff5f56;
            }

            .window-control.minimize {
                background-color: #ffbd2e;
            }

            .window-control.maximize {
                background-color: #27c93f;
            }

            .window-title {
                flex-grow: 1;
                text-align: center;
                font-size: 14px;
            }

            /* Tab Bar */
            .tab-bar {
                background-color: #252526;
                height: 35px;
                display: flex;
                align-items: center;
            }

            .tab {
                height: 100%;
                padding: 0 15px;
                display: flex;
                align-items: center;
                border-right: 1px solid #333;
                cursor: pointer;
            }

            .tab.active {
                background-color: #1e1e1e;
            }

            .tab-file-name {
                color: #d4d4d4;
                font-size: 13px;
            }

            /* Editor Area */
            .editor-area {
                background-color: #1e1e1e;
                padding: 10px;
                overflow: auto;
                max-height: 500px;
            }

            .editor-area pre {
                margin: 0;
                font-size: 13px;
                line-height: 1.5;
            }

            /* Syntax Highlighting Override */
            .hljs {
                background: none;
            }

            /* Scrollbars */
            .editor-area::-webkit-scrollbar {
                width: 8px;
            }

            .editor-area::-webkit-scrollbar-thumb {
                background-color: #555;
                border-radius: 4px;
            }

            .editor-area::-webkit-scrollbar-thumb:hover {
                background-color: #777;
            }

            /* Debug and Message Elements */
            #debug {
                position: fixed;
                bottom: 10px;
                left: 10px;
                background-color: rgba(0, 0, 0, 0.8);
                color: #d4d4d4;
                padding: 10px;
                border-radius: 5px;
                max-width: 300px;
                max-height: 200px;
                overflow: auto;
                display: none;
                font-size: 12px;
                z-index: 1000;
            }

            #message {
                position: fixed;
                top: 10px;
                left: 50%;
                transform: translateX(-50%);
                background-color: #ff0000;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                display: none;
                z-index: 1000;
            }

            /* Zoom Controls */
            #zoomControls {
                position: fixed;
                top: 10px;
                right: 10px;
                display: flex;
                flex-direction: column;
                gap: 5px;
                z-index: 1000;
            }

            #zoomIn, #zoomOut {
                background-color: #007acc;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.2s, box-shadow 0.2s;
                font-size: 14px;
            }

            #zoomIn:hover, #zoomOut:hover {
                background-color: #005f9e;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }

            /* Toggle Debug Button */
            #toggleDebug {
                position: fixed;
                bottom: 10px;
                right: 10px;
                background-color: #007acc;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.2s, box-shadow 0.2s;
                z-index: 1000;
                font-size: 14px;
            }

            #toggleDebug:hover {
                background-color: #005f9e;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            }
        </style>
    `;
}
