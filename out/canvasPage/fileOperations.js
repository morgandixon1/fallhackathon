"use strict";
// This file contains functions for file operations in a VS Code extension.
// It includes methods to update file content, save card positions, and save zoom levels.
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
exports.updateFileContent = updateFileContent;
exports.saveCardPosition = saveCardPosition;
exports.saveZoomLevel = saveZoomLevel;
const vscode = __importStar(require("vscode"));
function updateFileContent(filePath, newContent, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(filePath));
            if (!workspaceFolder) {
                throw new Error('Workspace folder not found for the file.');
            }
            const fileUri = vscode.Uri.file(filePath);
            const document = yield vscode.workspace.openTextDocument(fileUri);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(fileUri, new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length)), newContent);
            const success = yield vscode.workspace.applyEdit(edit);
            if (success) {
                yield document.save();
                vscode.window.showInformationMessage(`Updated file: ${filePath}`);
            }
            else {
                vscode.window.showErrorMessage(`Failed to update file: ${filePath}`);
            }
        }
        catch (error) {
            console.error('Error updating file:', error);
            vscode.window.showErrorMessage('Failed to update file: ' + (error instanceof Error ? error.message : String(error)));
        }
    });
}
function saveCardPosition(filePath, position, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const positions = context.globalState.get('cardPositions') || {};
            positions[filePath] = position;
            yield context.globalState.update('cardPositions', positions);
            console.log(`Saved position for ${filePath}:`, position);
        }
        catch (error) {
            console.error('Error saving card position:', error);
            vscode.window.showErrorMessage('Failed to save card position: ' + (error instanceof Error ? error.message : String(error)));
        }
    });
}
function saveZoomLevel(zoom, context) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield context.globalState.update('canvasZoomLevel', zoom);
            console.log(`Saved zoom level: ${zoom}`);
        }
        catch (error) {
            console.error('Error saving zoom level:', error);
            vscode.window.showErrorMessage('Failed to save zoom level: ' + (error instanceof Error ? error.message : String(error)));
        }
    });
}
