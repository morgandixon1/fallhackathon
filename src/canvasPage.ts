import * as vscode from 'vscode';

export function openCanvasPage() {
  const panel = vscode.window.createWebviewPanel(
    'canvasPage',
    '2D Canvas Page',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  panel.webview.html = getWebviewContent();
}

function getWebviewContent(): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>2D Canvas Page</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #f0f0f0;
        }
        .canvas-container {
          width: 4000px;
          height: 3000px;
          position: relative;
          overflow: hidden;
        }
        canvas {
          position: absolute;
          top: 0;
          left: 0;
        }
        .scroll-area {
          width: 100vw;
          height: 100vh;
          overflow: auto;
        }
      </style>
    </head>
    <body>
      <div class="scroll-area">
        <div class="canvas-container">
          <canvas id="canvas"></canvas>
        </div>
      </div>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const container = document.querySelector('.canvas-container');

        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        // Function to draw a grid
        function drawGrid() {
          ctx.strokeStyle = '#ddd';
          ctx.lineWidth = 1;

          for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          for (let y = 0; y < canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }
        }

        // Function to draw some sample content
        function drawContent() {
          // Draw some rectangles
          for (let i = 0; i < 20; i++) {
            ctx.fillStyle = 'hsl(' + (Math.random() * 360) + ', 70%, 70%)';
            ctx.fillRect(
              Math.random() * canvas.width,
              Math.random() * canvas.height,
              100 + Math.random() * 200,
              100 + Math.random() * 200
            );
          }

          // Draw some text
          ctx.font = '48px Arial';
          ctx.fillStyle = 'black';
          ctx.fillText('Scroll around to explore!', 50, 100);
        }

        // Draw the grid and content
        drawGrid();
        drawContent();
      </script>
    </body>
    </html>
  `;
}