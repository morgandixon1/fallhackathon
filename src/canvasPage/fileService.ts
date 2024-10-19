// This file contains a function to retrieve workspace files in a VS Code extension.
// It searches for files in the workspace and returns their paths and contents.

import * as vscode from 'vscode';
import { FileInfo } from './types';
import * as fs from 'fs';

export async function getWorkspaceFiles(): Promise<FileInfo[]> {
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