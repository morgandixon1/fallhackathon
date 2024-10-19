// This file defines TypeScript interfaces used in the VS Code extension.
// Currently, it only contains the FileInfo interface for representing file data.

export interface FileInfo {
    path: string;
    content: string;
}