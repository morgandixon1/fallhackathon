"use strict";
// canvasPage.ts
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openCanvasPage = openCanvasPage;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const linking_1 = require("./canvasPage/linking"); // Adjust the path if necessary
function openCanvasPage(context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('openCanvasPage function called');
        const panel = vscode.window.createWebviewPanel('canvasPage', '2D Canvas Page', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        console.log('Webview panel created');
        try {
            let files = [];
            let connections = [];
            try {
                files = yield getWorkspaceFiles();
                console.log(`Found ${files.length} files in workspace`);
                if (files.length > 0) {
                    console.log('First file:', JSON.stringify(files[0], null, 2)); // Log the first file for debugging
                }
                // Compute connections using linking.ts
                connections = (0, linking_1.createAdjacencyArray)(files);
                console.log(`Found ${connections.length} connections`);
                if (connections.length > 0) {
                    console.log('First connection:', JSON.stringify(connections[0], null, 2));
                }
            }
            catch (error) {
                console.error('Error getting workspace files or computing connections:', error);
            }
            // Retrieve saved positions
            let savedPositions = {};
            try {
                savedPositions = context.globalState.get('cardPositions') || {};
                console.log('Retrieved saved positions:', savedPositions);
            }
            catch (error) {
                console.error('Error retrieving saved positions:', error);
            }
            // Retrieve saved zoom level
            let savedZoom = 0.6; // More zoomed-out initial view
            try {
                const storedZoom = context.globalState.get('canvasZoomLevel');
                if (storedZoom !== undefined) {
                    savedZoom = storedZoom;
                }
                console.log('Retrieved zoom level:', savedZoom);
            }
            catch (error) {
                console.error('Error retrieving zoom level:', error);
            }
            // Generate the webview HTML content, including connections
            panel.webview.html = getWebviewContent(files, connections, savedPositions, savedZoom);
            console.log('Webview content set');
            // Handle disposal of the webview
            panel.onDidDispose(() => {
                console.log('Webview panel disposed');
            }, null, context.subscriptions);
            // Set up a file watcher to update connections on file save
            const fileWatcher = vscode.workspace.onDidSaveTextDocument((document) => __awaiter(this, void 0, void 0, function* () {
                console.log(`File saved: ${document.uri.fsPath}`);
                // Recompute connections
                try {
                    const updatedFiles = yield getWorkspaceFiles();
                    const updatedConnections = (0, linking_1.createAdjacencyArray)(updatedFiles);
                    console.log(`Updated connections: ${updatedConnections.length}`);
                    // Update the webview with new connections
                    panel.webview.postMessage({ command: 'updateConnections', connections: updatedConnections });
                }
                catch (error) {
                    console.error('Error updating connections after file save:', error);
                    panel.webview.postMessage({ command: 'error', text: 'Failed to update connections after file save.' });
                }
            }));
            context.subscriptions.push(fileWatcher);
            // Handle messages from the webview
            panel.webview.onDidReceiveMessage(message => {
                console.log('Received message from webview:', message);
                switch (message.command) {
                    case 'openFile':
                        if (message.file) {
                            const uri = vscode.Uri.file(message.file);
                            vscode.workspace.openTextDocument(uri).then(doc => {
                                vscode.window.showTextDocument(doc);
                            }, error => {
                                console.error('Error opening file:', error);
                                vscode.window.showErrorMessage('Failed to open file: ' + (error instanceof Error ? error.message : String(error)));
                            });
                        }
                        return;
                    case 'updateFile':
                        if (message.file && typeof message.content === 'string') {
                            updateFileContent(message.file, message.content, context);
                        }
                        return;
                    case 'savePosition':
                        if (message.file && message.position) {
                            saveCardPosition(message.file, message.position, context);
                        }
                        return;
                    case 'removeCard':
                        if (message.file) {
                            removeCardPosition(message.file, context);
                        }
                        return;
                    case 'saveZoom':
                        if (typeof message.zoom === 'number') {
                            context.globalState.update('canvasZoomLevel', message.zoom);
                            console.log(`Saved zoom level: ${message.zoom}`);
                        }
                        return;
                    case 'log':
                        console.log('Webview log:', message.text);
                        return;
                    case 'error':
                        console.error('Webview error:', message.text);
                        vscode.window.showErrorMessage('Canvas error: ' + message.text);
                        return;
                }
            }, undefined, context.subscriptions);
            console.log('Message listeners set up');
        }
        catch (error) {
            console.error('Error in openCanvasPage:', error);
            vscode.window.showErrorMessage('Failed to open canvas page: ' + (error instanceof Error ? error.message : String(error)));
        }
    });
}
function generateStyles() {
    return `
    <style>
      /* Existing styles */
      body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #1e1e1e;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #d4d4d4;
      }
      .scroll-area {
          width: 100vw;
          height: 100vh;
          overflow: auto;
          position: relative;
      }
      .canvas-container {
          width: 12000px;  /* Updated from 8000px */
          height: 9000px;  /* Updated from 6000px */
          position: relative;
          background-color: #252526;
          transition: transform 0.3s ease; /* Increased transition duration for smoother zoom */
      }
        .card {
          position: absolute;
          width: 400px; /* Increased width from 300px to 400px */
          min-height: 200px;
          background-color: #2d2d2d;
          border: 1px solid #444;
          border-radius: 8px;
          padding: 15px;
          box-shadow: 2px 2px 10px rgba(0,0,0,0.5);
          cursor: grab;
          transition: box-shadow 0.2s ease;
          overflow: hidden;
        }
        .card:active {
          box-shadow: 4px 4px 15px rgba(0,0,0,0.7);
          cursor: grabbing;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .card-header .file-name {
          font-weight: bold;
          font-size: 16px;
          color: #569cd6;
          word-break: break-all;
        }
        .card-header .save-button, .card-header .remove-button {
          background-color: #0e639c;
          border: none;
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-left: 5px;
        }
        .card-header .save-button:hover {
          background-color: #1177bb;
        }
        .card-header .remove-button {
          background-color: #d73a49;
        }
        .card-header .remove-button:hover {
          background-color: #c5303e;
        }
        .card-content {
          width: 100%;
          background-color: #1e1e1e;
          border: 1px solid #444;
          border-radius: 4px;
          padding: 10px;
          overflow: auto;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: #d4d4d4;
          white-space: pre-wrap;
        }
        #message {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 18px;
          color: #d4d4d4;
        }
        #debug {
          position: fixed;
          top: 50px;
          left: 10px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 10px;
          z-index: 1000;
          max-height: 90vh;
          overflow-y: auto;
          font-size: 12px;
          display: none;
        }
        #toggleDebug {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1001;
          padding: 5px 10px;
          background-color: #007acc;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        #toggleDebug:hover {
          background-color: #005fa3;
        }
        /* Zoom Controls */
        #controls {
          display: flex;
          gap: 5px;
        }

        #controls button {
          padding: 5px 10px;
          background-color: #0e639c;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
        }

        #controls button:hover {
          background-color: #1177bb;
        }

        /* Connection Arrows */
        .arrow {
          position: absolute;
          stroke: #ff0000;
          stroke-width: 2;
          marker-end: url(#arrowhead);
        }

        svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
    </style>
  `;
}
function generateScripts(fileData, connectionsData, savedPositionsData, nonce, savedZoom) {
    return `
    <script nonce="${nonce}">
      (function() {
        const vscode = acquireVsCodeApi();
        const canvasContainer = document.getElementById('canvasContainer');
        const messageElement = document.getElementById('message');
        const debugElement = document.getElementById('debug');
        const toggleDebugButton = document.getElementById('toggleDebug');

        let DEBUG_MODE = true;
        let currentZoom = ${savedZoom}; // Initialize with savedZoom

        const ZOOM_STEP = 0.01; // Reduced zoom step for smoother zoom
        const MAX_ZOOM = 2; // Increased max zoom for better usability
        const MIN_ZOOM = 0.2; // Further decreased min zoom for larger zoom-out area

        const CARD_WIDTH = 400; // Updated from 300 to 400
        const CARD_HEIGHT = 200; // Defined card height for constraints
        const CANVAS_WIDTH = 12000;
        const CANVAS_HEIGHT = 9000;

        toggleDebugButton.addEventListener('click', () => {
          if (debugElement.style.display === 'none') {
            debugElement.style.display = 'block';
            toggleDebugButton.textContent = 'Hide Debug';
          } else {
            debugElement.style.display = 'none';
            toggleDebugButton.textContent = 'Show Debug';
          }
        });

        function applyZoom() {
          canvasContainer.style.transform = \`scale(\${currentZoom})\`;
          canvasContainer.style.transformOrigin = '0 0';
          log('Zoom applied: ' + (currentZoom * 100).toFixed(0) + '%');
          // Save the zoom level
          vscode.postMessage({ command: 'saveZoom', zoom: currentZoom });
        }

        function log(message) {
          if (!DEBUG_MODE) return;
          console.log(message);
          const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          debugElement.innerHTML += sanitizedMessage + '<br>';
          vscode.postMessage({ command: 'log', text: message });
        }

        function error(message) {
          console.error(message);
          const sanitizedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
          debugElement.innerHTML += '<span style="color: red;">' + sanitizedMessage + '</span><br>';
          vscode.postMessage({ command: 'error', text: message });
        }

        // Initial Zoom Application
        applyZoom();

        // Pinch-to-zoom for trackpads
        canvasContainer.addEventListener('gesturechange', function(e) {
          e.preventDefault();
          let newZoom = currentZoom * e.scale;
          newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
          if (newZoom !== currentZoom) {
            currentZoom = newZoom;
            applyZoom();
          }
        });

        // Control + scroll wheel zoom for mouse
        canvasContainer.addEventListener('wheel', function(e) {
          if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            let newZoom = currentZoom + (delta * ZOOM_STEP);
            newZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
            if (newZoom !== currentZoom) {
              currentZoom = newZoom;
              applyZoom();
            }
          }
        });
        log('Webview script starting');

        let files;
        let connections;
        try {
          files = ${fileData};
          connections = ${connectionsData};
          log('Files loaded: ' + files.length);
          log('Connections loaded: ' + connections.length);
          if (files.length > 0) {
            log('First file: ' + JSON.stringify(files[0]));
          }
          if (connections.length > 0) {
            log('First connection: ' + JSON.stringify(connections[0]));
          }
        } catch (e) {
          error('Error parsing file or connection data: ' + e.message);
          return;
        }

        // Parse saved positions
        const savedPositions = ${savedPositionsData};

        if (files.length === 0) {
          messageElement.textContent = 'No workspace folder open or no files found. Please open a folder to view files.';
        } else {
          messageElement.style.display = 'none';
          createCards(files, savedPositions);
          drawConnections(connections);
        }

        function generateCardHTML(file, position) {
          const fileName = file.path.split('/').pop() || 'Unnamed File';
          const left = position ? \`\${position.x}px\` : '20px';
          const top = position ? \`\${position.y}px\` : '20px';
          let content = file.content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

          return \`
            <div class="card" data-file="\${file.path}" style="left: \${left}; top: \${top};">
              <div class="card-header">
                <div class="file-name">\${fileName}</div>
                <div>
                  <button class="save-button">Save</button>
                  <button class="remove-button">X</button>
                </div>
              </div>
              <div class="card-content" contenteditable="true" spellcheck="false">\${content}</div>
            </div>
          \`;
        }

        function calculateInitialPosition(index, total, occupiedPositions) {
          const desiredSpacingX = 450; // Increased horizontal spacing to accommodate wider cards
          const desiredSpacingY = 300; // Increased vertical spacing
          const cols = Math.floor(CANVAS_WIDTH / desiredSpacingX);
          const rows = Math.ceil(total / cols);
          const currentRow = Math.floor(index / cols);
          const currentCol = index % cols;

          let x = currentCol * desiredSpacingX + 50; // Adding margin
          let y = currentRow * desiredSpacingY + 50; // Adding margin

          // Ensure positions are within canvas bounds
          x = Math.max(0, Math.min(x, CANVAS_WIDTH - CARD_WIDTH));
          y = Math.max(0, Math.min(y, CANVAS_HEIGHT - CARD_HEIGHT));

          // Prevent overlapping
          let key = \`\${x},\${y}\`;
          if (!occupiedPositions.has(key)) {
            occupiedPositions.add(key);
            return { x, y };
          } else {
            // Find the next available spot
            let attempts = 0;
            while (occupiedPositions.has(key) && attempts < 100) {
              x += desiredSpacingX;
              y += desiredSpacingY;
              x = Math.max(0, Math.min(x, CANVAS_WIDTH - CARD_WIDTH));
              y = Math.max(0, Math.min(y, CANVAS_HEIGHT - CARD_HEIGHT));
              key = \`\${x},\${y}\`;
              attempts++;
            }
            occupiedPositions.add(key);
            return { x, y };
          }
        }

        function createCards(files, savedPositions) {
          log('Creating cards');
          const occupiedPositions = new Set();

          // Populate occupiedPositions with saved positions
          for (const pos of Object.values(savedPositions)) {
            const key = \`\${pos.x},\${pos.y}\`;
            occupiedPositions.add(key);
          }

          files.forEach((file, index) => {
            log('Creating card for file: ' + file.path);
            let position = savedPositions[file.path];
            if (!position) {
              position = calculateInitialPosition(index, files.length, occupiedPositions);
            } else {
              // Ensure saved position is within canvas bounds
              position.x = Math.max(0, Math.min(position.x, CANVAS_WIDTH - CARD_WIDTH));
              position.y = Math.max(0, Math.min(position.y, CANVAS_HEIGHT - CARD_HEIGHT));
            }
            const cardHTML = generateCardHTML(file, position);
            canvasContainer.insertAdjacentHTML('beforeend', cardHTML);
            const card = canvasContainer.querySelector(\`[data-file="\${file.path}"]\`);
            if (card) {
              makeDraggable(card);
              attachSaveHandler(card, file.path);
              attachRemoveHandler(card, file.path);
            }
          });
          log('Cards created');
        }

        function makeDraggable(element) {
          let isDragging = false;
          let offsetX, offsetY;

          element.addEventListener('mousedown', (e) => {
            if (e.target.closest('.card-content') || e.target.classList.contains('save-button') || e.target.classList.contains('remove-button')) return;
            isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            element.style.zIndex = 1000;
          });

          document.addEventListener('mousemove', (e) => {
            if (isDragging) {
              let newX = e.clientX - offsetX;
              let newY = e.clientY - offsetY;

              // Constrain within the canvas width and height
              newX = Math.max(0, Math.min(newX, CANVAS_WIDTH - CARD_WIDTH));
              newY = Math.max(0, Math.min(newY, CANVAS_HEIGHT - CARD_HEIGHT));

              element.style.left = newX + 'px';
              element.style.top = newY + 'px';
            }
          });

          document.addEventListener('mouseup', () => {
            if (isDragging) {
              isDragging = false;
              element.style.zIndex = 1;
              const position = { 
                x: parseInt(element.style.left), 
                y: parseInt(element.style.top) 
              };
              const filePath = element.getAttribute('data-file');
              if (filePath) {
                vscode.postMessage({ command: 'savePosition', file: filePath, position });
              }
              // After moving a card, redraw connections
              vscode.postMessage({ command: 'requestRedraw' });
            }
          });
        }

        function attachSaveHandler(card, filePath) {
          const saveButton = card.querySelector('.save-button');
          const contentDiv = card.querySelector('.card-content');

          saveButton.addEventListener('click', () => {
            const newContent = contentDiv.textContent;
            vscode.postMessage({ command: 'updateFile', file: filePath, content: newContent });
            // Provide immediate feedback
            saveButton.textContent = 'Saved!';
            setTimeout(() => {
              saveButton.textContent = 'Save';
            }, 2000);
          });
        }

        function attachRemoveHandler(card, filePath) {
          const removeButton = card.querySelector('.remove-button');

          removeButton.addEventListener('click', () => {
            // Remove the card from the DOM
            card.remove();
            // Notify the extension to remove the saved position
            vscode.postMessage({ command: 'removeCard', file: filePath });
            log('Removed card for file: ' + filePath);
            // After removing a card, redraw connections
            vscode.postMessage({ command: 'requestRedraw' });
          });
        }

        // Handle messages from extension (if needed)
        window.addEventListener('message', event => {
          const message = event.data;
          switch (message.command) {
            case 'log':
              log(message.text);
              break;
            case 'error':
              error(message.text);
              break;
            case 'updateConnections':
              connections = message.connections;
              drawConnections(connections);
              break;
            case 'requestRedraw':
              drawConnections(connections);
              break;
          }
        });

        function drawConnections(connections) {
          // Remove existing SVG if any
          const existingSVG = document.querySelector('svg');
          if (existingSVG) {
            existingSVG.remove();
          }

          // Create a new SVG element
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          
          // Define arrowhead marker
          const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
          const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
          marker.setAttribute('id', 'arrowhead');
          marker.setAttribute('markerWidth', '10');
          marker.setAttribute('markerHeight', '7');
          marker.setAttribute('refX', '0');
          marker.setAttribute('refY', '3.5');
          marker.setAttribute('orient', 'auto');
          const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
          polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
          polygon.setAttribute('fill', '#ff0000');
          marker.appendChild(polygon);
          defs.appendChild(marker);
          svg.appendChild(defs);

          connections.forEach(conn => {
            const fromCard = document.querySelector(\`[data-file="\${conn.fromFile}"]\`);
            const toCard = document.querySelector(\`[data-file="\${conn.toFile}"]\`);
            if (fromCard && toCard) {
              const startX = fromCard.offsetLeft + fromCard.offsetWidth / 2;
              const startY = fromCard.offsetTop + fromCard.offsetHeight / 2;
              const endX = toCard.offsetLeft + toCard.offsetWidth / 2;
              const endY = toCard.offsetTop + toCard.offsetHeight / 2;

              const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
              line.setAttribute('x1', startX.toString());
              line.setAttribute('y1', startY.toString());
              line.setAttribute('x2', endX.toString());
              line.setAttribute('y2', endY.toString());
              line.setAttribute('class', 'arrow');

              svg.appendChild(line);
            }
          });

          canvasContainer.appendChild(svg);
        }

        drawConnections(connections);

        log('Webview setup complete');
      })();
    </script>
  `;
}
function assembleHTML(styles, scripts, nonce) {
    return `
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
}
function getWebviewContent(files, connections, savedPositions, savedZoom) {
    console.log('Generating webview content');
    const fileData = JSON.stringify(files);
    const connectionsData = JSON.stringify(connections);
    const savedPositionsData = JSON.stringify(savedPositions);
    // Define nonce for security
    const nonce = getNonce();
    // Generate CSS styles
    const styles = generateStyles();
    // Generate JavaScript scripts with embedded generateCardHTML and initial zoom
    const scripts = generateScripts(fileData, connectionsData, savedPositionsData, nonce, savedZoom);
    // Assemble the complete HTML with the same nonce
    const html = assembleHTML(styles, scripts, nonce);
    return html;
}
function getWorkspaceFiles() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Getting workspace files');
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
            console.log('No workspace folder open');
            return [];
        }
        // Exclude .pyc files by adding '**/*.pyc' to the exclude pattern
        const files = yield vscode.workspace.findFiles('**/*', '**/node_modules/**,**/*.pyc');
        console.log(`Found ${files.length} files`);
        const fileInfos = yield Promise.all(files.slice(0, 100).map((file) => __awaiter(this, void 0, void 0, function* () {
            try {
                const content = yield fs.promises.readFile(file.fsPath, 'utf8');
                return { path: file.fsPath, content: content }; // Include full content with line numbers
            }
            catch (error) {
                console.error(`Error reading file ${file.fsPath}:`, error);
                return { path: file.fsPath, content: 'Error reading file' };
            }
        })));
        return fileInfos;
    });
}
function updateFileContent(filePath, newContent, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (!workspaceFolder) {
                throw new Error('Workspace folder not found for the file.');
            }
            const fileUri = vscode.Uri.file(filePath);
            const document = yield vscode.workspace.openTextDocument(fileUri);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(fileUri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), newContent);
            const success = yield vscode.workspace.applyEdit(edit);
            if (success) {
                yield document.save();
                vscode.window.showInformationMessage(`Updated file: ${filePath}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed to update file: ${filePath}`);
            }
        }
        catch (error) {
            console.error('Error updating file:', error);
            vscode.window.showErrorMessage('Failed to update file: ' + (error instanceof Error ? error.message : String(error)));
        }
    });
}
function saveCardPosition(filePath, position, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const positions = context.globalState.get('cardPositions') || {};
            positions[filePath] = position;
            yield context.globalState.update('cardPositions', positions);
            console.log(`Saved position for ${filePath}:`, position);
        }
        catch (error) {
            console.error('Error saving card position:', error);
            vscode.window.showErrorMessage('Failed to save card position: ' + (error instanceof Error ? error.message : String(error)));
        }
    });
}
function removeCardPosition(filePath, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const positions = context.globalState.get('cardPositions') || {};
            if (positions[filePath]) {
                delete positions[filePath];
                yield context.globalState.update('cardPositions', positions);
                console.log(`Removed position for ${filePath}`);
            }
        }
        catch (error) {
            console.error('Error removing card position:', error);
            vscode.window.showErrorMessage('Failed to remove card position: ' + (error instanceof Error ? error.message : String(error)));
        }
    });
}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
