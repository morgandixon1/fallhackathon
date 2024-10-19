import * as vscode from 'vscode';
import { showCanvas } from './canvasPage';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "my-extension" is now active!');

    let disposable = vscode.commands.registerCommand('extension.openCanvasPage', () => {
        showCanvas(context);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}