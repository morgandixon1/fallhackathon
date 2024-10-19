"use strict";
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const canvasPage_1 = require("./canvasPage");
class CanvasTreeDataProvider {
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element) {
            return Promise.resolve([]);
        }
        else {
            return Promise.resolve([
                new CanvasItem('Open Canvas', vscode.TreeItemCollapsibleState.None, {
                    command: 'extension.openCanvas',
                    title: 'Open Canvas',
                    arguments: []
                })
            ]);
        }
    }
}
class CanvasItem extends vscode.TreeItem {
    constructor(label, collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.tooltip = `${this.label}`;
        this.description = '';
    }
}
function activate(context) {
    console.log('Activating 2D Canvas Extension');
    const treeDataProvider = new CanvasTreeDataProvider();
    vscode.window.registerTreeDataProvider('canvasExplorer', treeDataProvider);
    const disposable = vscode.commands.registerCommand('extension.openCanvas', () => {
        console.log('openCanvas command triggered');
        (0, canvasPage_1.openCanvasPage)(context).catch(error => {
            console.error('Error in openCanvasPage:', error);
            vscode.window.showErrorMessage('Failed to open canvas page: ' + (error instanceof Error ? error.message : String(error)));
        });
    });
    context.subscriptions.push(disposable);
    console.log('2D Canvas Extension Activated');
}
function deactivate() {
    console.log('2D Canvas Extension Deactivated');
}
