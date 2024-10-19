"use strict";
// generateScripts.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateScripts = generateScripts;
function generateScripts(nonce, savedZoom) {
    return `
        <script nonce="${nonce}">
            (function() {
                const vscode = acquireVsCodeApi();
                const canvasContainer = document.getElementById('canvasContainer');
                const messageElement = document.getElementById('message');
                const debugElement = document.getElementById('debug');
                const toggleDebugButton = document.getElementById('toggleDebug');

                let DEBUG_MODE = true; // Set to false to disable logs
                let currentZoom = ${savedZoom || 1}; // Initial zoom level

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

                function applyZoom() {
                    canvasContainer.style.transform = \`scale(\${currentZoom})\`;
                    canvasContainer.style.transformOrigin = '0 0';
                    log('Zoom applied: ' + (currentZoom * 100).toFixed(0) + '%');
                    // Save the zoom level
                    vscode.postMessage({ command: 'saveZoom', zoom: currentZoom });
                }

                // Zoom Controls
                document.getElementById('zoomIn').addEventListener('click', () => {
                    currentZoom = Math.min(currentZoom + 0.1, MAX_ZOOM);
                    applyZoom();
                });

                document.getElementById('zoomOut').addEventListener('click', () => {
                    currentZoom = Math.max(currentZoom - 0.1, MIN_ZOOM);
                    applyZoom();
                });

                function log(message) {
                    if (!DEBUG_MODE) return;
                    console.log(message);
                    const sanitizedMessage = message
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                    debugElement.innerHTML += sanitizedMessage + '<br>';
                }

                function error(message) {
                    console.error(message);
                    const sanitizedMessage = message
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;");
                    debugElement.innerHTML += '<span style="color: red;">' + sanitizedMessage + '</span><br>';
                }

                log('Webview script starting');

                let files = [];
                try {
                    files = JSON.parse(document.getElementById('fileData').textContent);
                    log('Files loaded: ' + files.length);
                } catch (e) {
                    error('Error parsing file data: ' + e.message);
                    return;
                }

                // Parse saved positions
                let savedPositions = {};
                try {
                    savedPositions = JSON.parse(document.getElementById('savedPositionsData').textContent);
                } catch (e) {
                    error('Error parsing saved positions: ' + e.message);
                }

                if (files.length === 0) {
                    messageElement.textContent = 'No workspace folder open or no files found. Please open a folder to view files.';
                    messageElement.style.display = 'block';
                } else {
                    messageElement.style.display = 'none';
                    createCards(files, savedPositions);
                    // Apply initial zoom
                    applyZoom();
                    adjustCanvasSize();
                }

                // Variables for panning
                let isPanning = false;
                let startX, startY;
                let scrollLeft, scrollTop;

                // Apply panning on the scroll-area
                const scrollArea = document.querySelector('.scroll-area');

                scrollArea.addEventListener('mousedown', (e) => {
                    if (e.target.closest('.card')) return; // Ignore if clicking on a card
                    isPanning = true;
                    scrollArea.style.cursor = 'grabbing';
                    startX = e.pageX - scrollArea.offsetLeft;
                    startY = e.pageY - scrollArea.offsetTop;
                    scrollLeft = scrollArea.scrollLeft;
                    scrollTop = scrollArea.scrollTop;
                });

                scrollArea.addEventListener('mouseleave', () => {
                    isPanning = false;
                    scrollArea.style.cursor = 'default';
                });

                scrollArea.addEventListener('mouseup', () => {
                    isPanning = false;
                    scrollArea.style.cursor = 'default';
                });

                scrollArea.addEventListener('mousemove', (e) => {
                    if (!isPanning) return;
                    e.preventDefault();
                    const x = e.pageX - scrollArea.offsetLeft;
                    const y = e.pageY - scrollArea.offsetTop;
                    const walkX = (x - startX) * 1; // Adjust the multiplier for speed
                    const walkY = (y - startY) * 1;
                    scrollArea.scrollLeft = scrollLeft - walkX;
                    scrollArea.scrollTop = scrollTop - walkY;
                });

                function getLanguageFromFilename(filename) {
                    const extension = filename.split('.').pop();
                    const extensionToLanguageMap = {
                        'js': 'javascript',
                        'ts': 'typescript',
                        'py': 'python',
                        'java': 'java',
                        'c': 'c',
                        'cpp': 'cpp',
                        'cs': 'csharp',
                        'rb': 'ruby',
                        'go': 'go',
                        'php': 'php',
                        'html': 'html',
                        'css': 'css',
                        'json': 'json',
                        'md': 'markdown',
                        // Add more mappings as needed
                    };
                    return extensionToLanguageMap[extension] || 'plaintext';
                }

                function generateCardHTML(file, position) {
                    const fileName = file.path.split('/').pop() || 'Unnamed File';
                    const left = position ? \`\${position.x}px\` : '20px';
                    const top = position ? \`\${position.y}px\` : '20px';
                    const language = getLanguageFromFilename(fileName);
                    const content = file.content
                        .replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");

                    return \`
                        <div class="card" data-file="\${file.path}" style="left: \${left}; top: \${top};">
                            <div class="window-title-bar">
                                <div class="window-controls">
                                    <div class="window-control close"></div>
                                    <div class="window-control minimize"></div>
                                    <div class="window-control maximize"></div>
                                </div>
                                <div class="window-title">\${fileName}</div>
                            </div>
                            <div class="tab-bar">
                                <div class="tab active">
                                    <span class="tab-file-name">\${fileName}</span>
                                </div>
                            </div>
                            <div class="editor-area">
                                <pre><code class="\${language}">\${content}</code></pre>
                            </div>
                        </div>
                    \`;
                }

                function calculateInitialPosition(index, total, cols = 4, spacingX = 800, spacingY = 600) {
                    const row = Math.floor(index / cols);
                    const col = index % cols;
                    const x = 100 + col * spacingX;
                    const y = 100 + row * spacingY;
                    return { x, y };
                }

                function createCards(files, savedPositions) {
                    log('Creating cards');
                    files.forEach((file, index) => {
                        log('Creating card for file: ' + file.path);
                        let position = savedPositions[file.path];
                        if (!position) {
                            position = calculateInitialPosition(index, files.length);
                        }
                        const cardHTML = generateCardHTML(file, position);
                        canvasContainer.insertAdjacentHTML('beforeend', cardHTML);
                        const card = canvasContainer.querySelector(\`[data-file="\${file.path}"]\`);
                        if (card) {
                            makeDraggable(card);
                            // attachSaveHandler(card, file.path); // Optional: Attach save handler if needed
                        }
                    });

                    // After all cards are created, apply syntax highlighting
                    if (window.hljs) {
                        window.hljs.highlightAll();
                        log('Syntax highlighting applied');
                    } else {
                        error('Highlight.js is not loaded.');
                    }

                    log('Cards created');
                }

                function makeDraggable(element) {
                    let isDragging = false;
                    let offsetX, offsetY;

                    element.addEventListener('mousedown', (e) => {
                        if (e.target.closest('.editor-area') || e.target.classList.contains('save-button')) return;
                        isDragging = true;
                        const rect = element.getBoundingClientRect();
                        offsetX = (e.clientX - rect.left) / currentZoom;
                        offsetY = (e.clientY - rect.top) / currentZoom;
                        element.style.zIndex = 1000; // Bring to front
                    });

                    document.addEventListener('mousemove', (e) => {
                        if (isDragging) {
                            const canvasRect = canvasContainer.getBoundingClientRect();
                            let newX = (e.clientX - canvasRect.left - offsetX * currentZoom) / currentZoom;
                            let newY = (e.clientY - canvasRect.top - offsetY * currentZoom) / currentZoom;

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
                                x: Math.round((rect.left - canvasRect.left) / currentZoom),
                                y: Math.round((rect.top - canvasRect.top) / currentZoom)
                            };
                            const filePath = element.getAttribute('data-file');
                            if (filePath) {
                                vscode.postMessage({ command: 'savePosition', file: filePath, position });
                            }
                        }
                    });
                }

                function adjustCanvasSize() {
                    let maxX = 0;
                    let maxY = 0;

                    const cards = canvasContainer.querySelectorAll('.card');
                    cards.forEach(card => {
                        const rect = card.getBoundingClientRect();
                        const right = parseFloat(card.style.left) + rect.width;
                        const bottom = parseFloat(card.style.top) + rect.height;
                        if (right > maxX) maxX = right;
                        if (bottom > maxY) maxY = bottom;
                    });

                    canvasContainer.style.width = (maxX + 500) + 'px'; // Add extra space
                    canvasContainer.style.height = (maxY + 500) + 'px';
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
