// canvasPage.ts

import * as vscode from 'vscode';
import { FileInfo } from './canvasPage/types';
import { generateHTML } from './canvasPage/generateHTML';
import { getWorkspaceFiles } from './canvasPage/fileService'; // Ensure this function is defined
import { updateFileContent, saveCardPosition, saveZoomLevel } from './canvasPage/fileOperations'; // Ensure these functions are defined

export async function showCanvas(context: vscode.ExtensionContext) {
    console.log('showCanvas function called');

    // Get the extension's URI
    const extensionUri = context.extensionUri;

    // Create the webview panel
    const panel = vscode.window.createWebviewPanel(
        'canvasView',
        'Canvas View',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
        }
    );

    console.log('Webview panel created');

    try {
        // Load workspace files
        const files: FileInfo[] = await getWorkspaceFiles();
        console.log(`Found ${files.length} files in workspace`);

        // Retrieve saved positions and zoom level from global state
        const savedPositions = context.globalState.get<{ [key: string]: { x: number; y: number } }>('cardPositions') || {};
        console.log('Retrieved saved positions:', savedPositions);

        const savedZoom = context.globalState.get<number>('canvasZoomLevel') || 1;
        console.log('Retrieved saved zoom level:', savedZoom);

        // Generate the HTML content
        panel.webview.html = generateHTML(
            panel.webview,
            extensionUri,
            files,
            savedPositions,
            savedZoom
        );

        console.log('Webview content set');

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
                            saveZoomLevel(message.zoom, context);
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
        console.error('Error in showCanvas:', error);
        vscode.window.showErrorMessage('Failed to open canvas page: ' + (error instanceof Error ? error.message : String(error)));
    }
}
