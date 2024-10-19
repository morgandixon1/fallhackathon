# My Extension

This is a simple VSCode extension that opens a scrollable 2D canvas.

## Usage

1. Press `Ctrl + Shift + P` (or `Cmd + Shift + P` on Mac).
2. Run the command **Open Canvas**.
3. A webview will open with a 2D canvas.
# fallhackathon


Here's a breakdown of the key files in your project:

extension.ts: This is the main entry point of your extension. It contains the activate function that runs when your extension is activated, and the deactivate function that runs when it's deactivated. It also sets up the tree view and registers the command to open the canvas page.
canvasPage.ts: This file contains the logic for creating and managing the webview that displays your canvas. It includes functions to fetch workspace files and generate the HTML content for the webview.
package.json: This is the manifest file for your extension. It defines metadata about your extension, its dependencies, activation events, and contributed commands and views. You'll edit this file when you need to add new commands, change the extension's metadata, or modify its configuration.
launch.json: This file is used for debugging your extension. It contains configuration for how VSCode should launch a new window with your extension for debugging purposes.
tsconfig.json: This is the TypeScript configuration file. It specifies compiler options and which files should be included in the compilation.
README.md: This is where you should put documentation for your extension, explaining what it does and how to use it.
icon.png: This is the icon for your extension, which appears in the VSCode marketplace and in the activity bar if you've set up a custom view container.
out/extension.js and out/canvasPage.js: These are the compiled JavaScript files from your TypeScript source. You don't edit these directly; they're generated when you build your extension.
node_modules/: This directory contains all the npm packages that your extension depends on. You don't edit these files directly.

When you need to make edits:

To change how the extension activates or to add new commands: Edit extension.ts
To modify the canvas page behavior or appearance: Edit canvasPage.ts
To change extension metadata, add new commands, or modify configuration: Edit package.json
To update the extension icon: Replace icon.png
To modify TypeScript compilation settings: Edit tsconfig.json
To update extension documentation: Edit README.md