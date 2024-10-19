// utils/helpers.ts

export function sanitizeContent(content: string): string {
    return content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

const extensionToLanguageMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'jsx': 'javascript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cs': 'csharp',
    'rb': 'ruby',
    'go': 'go',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'swift': 'swift',
    'kt': 'kotlin',
    // Add more as needed
};
