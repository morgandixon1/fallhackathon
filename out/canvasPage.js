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
exports.showCanvas = showCanvas;
const vscode = __importStar(require("vscode"));
const generateHTML_1 = require("./canvasPage/generateHTML");
const fileService_1 = require("./canvasPage/fileService"); // Ensure this function is defined
const fileOperations_1 = require("./canvasPage/fileOperations"); // Ensure these functions are defined
function showCanvas(context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('showCanvas function called');
        // Get the extension's URI
        const extensionUri = context.extensionUri;
        // Create the webview panel
        const panel = vscode.window.createWebviewPanel('canvasView', 'Canvas View', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
        });
        console.log('Webview panel created');
        try {
            // Load workspace files
            const files = yield (0, fileService_1.getWorkspaceFiles)();
            console.log(`Found ${files.length} files in workspace`);
            // Retrieve saved positions and zoom level from global state
            const savedPositions = context.globalState.get('cardPositions') || {};
            console.log('Retrieved saved positions:', savedPositions);
            const savedZoom = context.globalState.get('canvasZoomLevel') || 1;
            console.log('Retrieved saved zoom level:', savedZoom);
            // Generate the HTML content
            panel.webview.html = (0, generateHTML_1.generateHTML)(panel.webview, extensionUri, files, savedPositions, savedZoom);
            console.log('Webview content set');
            panel.onDidDispose(() => {
                console.log('Webview panel disposed');
            }, null, context.subscriptions);
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
                            (0, fileOperations_1.updateFileContent)(message.file, message.content, context);
                        }
                        return;
                    case 'savePosition':
                        if (message.file && message.position) {
                            (0, fileOperations_1.saveCardPosition)(message.file, message.position, context);
                        }
                        return;
                    case 'saveZoom':
                        if (typeof message.zoom === 'number') {
                            (0, fileOperations_1.saveZoomLevel)(message.zoom, context);
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
            console.error('Error in showCanvas:', error);
            vscode.window.showErrorMessage('Failed to open canvas page: ' + (error instanceof Error ? error.message : String(error)));
        }
    });
}
