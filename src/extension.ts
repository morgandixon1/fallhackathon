import * as vscode from 'vscode';
import { openCanvasPage } from './canvasPage';

export function activate(context: vscode.ExtensionContext) {
  // Open the canvas page immediately when the extension is activated
  openCanvasPage();

  // Register the command to open the canvas webview
  const disposable = vscode.commands.registerCommand('extension.openCanvas', () => {
    openCanvasPage();
  });

  context.subscriptions.push(disposable);

  vscode.window.showInformationMessage('2D Canvas Extension Activated');
}

export function deactivate() {}