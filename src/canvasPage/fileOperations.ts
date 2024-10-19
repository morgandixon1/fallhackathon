// This file contains functions for file operations in a VS Code extension.
// It includes methods to update file content, save card positions, and save zoom levels.

import * as vscode from 'vscode';
import { FileInfo } from './types';

export async function updateFileContent(filePath: string, newContent: string, context: vscode.ExtensionContext) {
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

export async function saveCardPosition(filePath: string, position: { x: number; y: number }, context: vscode.ExtensionContext) {
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

export async function saveZoomLevel(zoom: number, context: vscode.ExtensionContext) {
    try {
        await context.globalState.update('canvasZoomLevel', zoom);
        console.log(`Saved zoom level: ${zoom}`);
    } catch (error) {
        console.error('Error saving zoom level:', error);
        vscode.window.showErrorMessage('Failed to save zoom level: ' + (error instanceof Error ? error.message : String(error)));
    }
}