import * as vscode from 'vscode';
import * as fs from 'fs'; // Import the fs module

export interface FileInfo {
  path: string;
  content: string;
}

export async function openCanvasPage(context: vscode.ExtensionContext) {
  console.log('openCanvasPage function called');

  const panel = vscode.window.createWebviewPanel(
    'canvasPage',
    '2D Canvas Page',
    vscode.ViewColumn.One,
    { 
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );

  console.log('Webview panel created');

  try {
    let files: FileInfo[] = [];
    try {
      files = await getWorkspaceFiles();
      console.log(`Found ${files.length} files in workspace`);
      if (files.length > 0) {
        console.log('First file:', JSON.stringify(files[0], null, 2)); // Log the first file for debugging
      }
    } catch (error) {
      console.error('Error getting workspace files:', error);
    }

    // Retrieve saved positions
    let savedPositions: { [key: string]: { x: number; y: number } } = {};
    try {
      savedPositions = context.globalState.get<{ [key: string]: { x: number; y: number } }>('cardPositions') || {};
      console.log('Retrieved saved positions:', savedPositions);
    } catch (error) {
      console.error('Error retrieving saved positions:', error);
    }

    // Retrieve saved zoom level
    let savedZoom: number = 1;
    try {
      savedZoom = context.globalState.get<number>('canvasZoomLevel') || 1;
      console.log('Retrieved saved zoom level:', savedZoom);
    } catch (error) {
      console.error('Error retrieving saved zoom level:', error);
    }

    // Generate the webview HTML content
    panel.webview.html = getWebviewContent(files, savedPositions, savedZoom);
    console.log('Webview content set');

    // Handle disposal of the webview
    panel.onDidDispose(() => {
      console.log('Webview panel disposed');
    }, null, context.subscriptions);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      message => {
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
      },
      undefined,
      context.subscriptions
    );

    console.log('Message listeners set up');
  } catch (error) {
    console.error('Error in openCanvasPage:', error);
    vscode.window.showErrorMessage('Failed to open canvas page: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function generateStyles(): string {
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
        width: 8000px;
        height: 6000px;
        position: relative;
        background-color: #252526;
        transition: transform 0.2s ease;
      }
      .card {
        position: absolute;
        width: 300px;
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
      .card-header .save-button {
        background-color: #0e639c;
        border: none;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      .card-header .save-button:hover {
        background-color: #1177bb;
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
    </style>
  `;
}

function generateScripts(fileData: string, savedPositionsData: string, nonce: string): string {
  return `
    <script nonce="${nonce}">
      (function() {
        const vscode = acquireVsCodeApi();
        const canvasContainer = document.getElementById('canvasContainer');
        const messageElement = document.getElementById('message');
        const debugElement = document.getElementById('debug');
        const toggleDebugButton = document.getElementById('toggleDebug');
        const zoomInButton = document.getElementById('zoomIn');
        const zoomOutButton = document.getElementById('zoomOut');

        let DEBUG_MODE = true; // Set to false to disable logs
        let currentZoom = 1; // Initial zoom level

        const ZOOM_STEP = 0.1; // Zoom increment/decrement
        const MAX_ZOOM = 3; // Maximum zoom level
        const MIN_ZOOM = 0.5; // Minimum zoom level

        toggleDebugButton.addEventListener('click', () => {
          if (debugElement.style.display === 'none') {
            debugElement.style.display = 'block';
            toggleDebugButton.textContent = 'Hide Debug';
          } else {
            debugElement.style.display = 'none';
            toggleDebugButton.textContent = 'Show Debug';
          }
        });

        zoomInButton.addEventListener('click', () => {
          if (currentZoom < MAX_ZOOM) {
            currentZoom += ZOOM_STEP;
            applyZoom();
          }
        });

        zoomOutButton.addEventListener('click', () => {
          if (currentZoom > MIN_ZOOM) {
            currentZoom -= ZOOM_STEP;
            applyZoom();
          }
        });

        function applyZoom() {
          canvasContainer.style.transform = \`scale(\${currentZoom})\`;
          canvasContainer.style.transformOrigin = '0 0';
          log('Zoom applied: ' + (currentZoom * 100) + '%');
          // Optionally, save the zoom level
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

        log('Webview script starting');

        let files;
        try {
          files = ${fileData};
          log('Files loaded: ' + files.length);
          if (files.length > 0) {
            log('First file: ' + JSON.stringify(files[0]));
          }
        } catch (e) {
          error('Error parsing file data: ' + e.message);
          return;
        }

        // Parse saved positions
        const savedPositions = ${savedPositionsData};

        if (files.length === 0) {
          messageElement.textContent = 'No workspace folder open or no files found. Please open a folder to view files.';
        } else {
          messageElement.style.display = 'none';
          createCards(files, savedPositions);
        }

        function generateCardHTML(file, position) {
          const fileName = file.path.split('/').pop() || 'Unnamed File';
          const left = position ? \`\${position.x}px\` : '20px';
          const top = position ? \`\${position.y}px\` : '20px';
          const content = file.content
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

          return \`
            <div class="card" data-file="\${file.path}" style="left: \${left}; top: \${top};">
              <div class="card-header">
                <div class="file-name">\${fileName}</div>
                <button class="save-button">Save</button>
              </div>
              <div class="card-content" contenteditable="true" spellcheck="false">\${content}</div>
            </div>
          \`;
        }

        function calculateInitialPosition(index, total, occupiedPositions) {
          const cols = 5; // Number of columns in the grid
          const spacingX = 350; // Horizontal spacing between cards
          const spacingY = 250; // Vertical spacing between cards
          let x, y;
          
          for (let row = 0; row < Math.ceil(total / cols); row++) {
            for (let col = 0; col < cols; col++) {
              x = 20 + col * spacingX;
              y = 20 + row * spacingY;
              const key = \`\${x},\${y}\`;
              if (!occupiedPositions.has(key)) {
                occupiedPositions.add(key);
                return { x, y };
              }
            }
          }

          // Fallback in case all predefined positions are occupied
          x = 20 + (index % cols) * spacingX;
          y = 20 + Math.floor(index / cols) * spacingY;
          return { x, y };
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
              // Calculate initial position to prevent stacking
              position = calculateInitialPosition(index, files.length, occupiedPositions);
            }
            const cardHTML = generateCardHTML(file, position);
            canvasContainer.insertAdjacentHTML('beforeend', cardHTML);
            const card = canvasContainer.querySelector(\`[data-file="\${file.path}"]\`);
            if (card) {
              makeDraggable(card);
              attachSaveHandler(card, file.path);
            }
          });
          log('Cards created');
        }

        function makeDraggable(element) {
          let isDragging = false;
          let offsetX, offsetY;

          element.addEventListener('mousedown', (e) => {
            // Prevent dragging when interacting with editable content or buttons
            if (e.target.closest('.card-content') || e.target.classList.contains('save-button')) return;
            isDragging = true;
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            element.style.zIndex = 1000; // Bring to front
          });

          document.addEventListener('mousemove', (e) => {
            if (isDragging) {
              let newX = e.clientX - offsetX;
              let newY = e.clientY - offsetY;

              // Constrain within the canvas area
              const canvasRect = canvasContainer.getBoundingClientRect();
              const cardRect = element.getBoundingClientRect();

              // Adjust positions relative to canvas
              newX = e.clientX - canvasRect.left - offsetX;
              newY = e.clientY - canvasRect.top - offsetY;

              if (newX < 0) newX = 0;
              if (newY < 0) newY = 0;
              if (newX + cardRect.width > canvasRect.width) {
                newX = canvasRect.width - cardRect.width;
              }
              if (newY + cardRect.height > canvasRect.height) {
                newY = canvasRect.height - cardRect.height;
              }

              element.style.left = newX + 'px';
              element.style.top = newY + 'px';
            }
          });

          document.addEventListener('mouseup', () => {
            if (isDragging) {
              isDragging = false;
              element.style.zIndex = 1; // Reset z-index
              // Save the new position
              const rect = element.getBoundingClientRect();
              const canvasRect = canvasContainer.getBoundingClientRect();
              const position = { 
                x: rect.left - canvasRect.left, 
                y: rect.top - canvasRect.top 
              };
              const filePath = element.getAttribute('data-file');
              if (filePath) {
                vscode.postMessage({ command: 'savePosition', file: filePath, position });
              }
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
          }
        });

        log('Webview setup complete');
      })();
    </script>
  `;
}

function assembleHTML(styles: string, scripts: string, nonce: string): string {
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
}

function getWebviewContent(
  files: FileInfo[],
  savedPositions: { [key: string]: { x: number; y: number } },
  savedZoom: number
): string {
  console.log('Generating webview content');
  const fileData = JSON.stringify(files);
  const savedPositionsData = JSON.stringify(savedPositions);

  // Define nonce for security
  const nonce = getNonce();

  // Generate CSS styles
  const styles = generateStyles();

  // Generate JavaScript scripts with embedded generateCardHTML
  const scripts = generateScripts(fileData, savedPositionsData, nonce);

  // Assemble the complete HTML with the same nonce
  const html = assembleHTML(styles, scripts, nonce);

  return html;
}

async function getWorkspaceFiles(): Promise<FileInfo[]> {
  console.log('Getting workspace files');
  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    console.log('No workspace folder open');
    return [];
  }

  const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
  console.log(`Found ${files.length} files`);

  const fileInfos: FileInfo[] = await Promise.all(
    files.slice(0, 100).map(async (file) => { // Adjust limit as needed
      try {
        const content = await fs.promises.readFile(file.fsPath, 'utf8');
        return { path: file.fsPath, content: content }; // Removed content slice to include full content
      } catch (error) {
        console.error(`Error reading file ${file.fsPath}:`, error);
        return { path: file.fsPath, content: 'Error reading file' };
      }
    })
  );

  return fileInfos;
}

async function updateFileContent(filePath: string, newContent: string, context: vscode.ExtensionContext) {
  try {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
    if (!workspaceFolder) {
      throw new Error('Workspace folder not found for the file.');
    }
    const fileUri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(fileUri);
    const edit = new vscode.WorkspaceEdit();
    edit.replace(fileUri, new vscode.Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    ), newContent);
    const success = await vscode.workspace.applyEdit(edit);
    if (success) {
      await document.save();
      vscode.window.showInformationMessage(`Updated file: ${filePath}`);
    } else {
      vscode.window.showErrorMessage(`Failed to update file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error updating file:', error);
    vscode.window.showErrorMessage('Failed to update file: ' + (error instanceof Error ? error.message : String(error)));
  }
}

async function saveCardPosition(filePath: string, position: { x: number; y: number }, context: vscode.ExtensionContext) {
  try {
    const positions = context.globalState.get<{ [key: string]: { x: number; y: number } }>('cardPositions') || {};
    positions[filePath] = position;
    await context.globalState.update('cardPositions', positions);
    console.log(`Saved position for ${filePath}:`, position);
  } catch (error) {
    console.error('Error saving card position:', error);
    vscode.window.showErrorMessage('Failed to save card position: ' + (error instanceof Error ? error.message : String(error)));
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
