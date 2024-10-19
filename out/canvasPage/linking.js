"use strict";
// linking.ts
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
exports.createAdjacencyArray = createAdjacencyArray;
const ts = __importStar(require("typescript"));
const path = __importStar(require("path"));
function createAdjacencyArray(files) {
    const exportMap = new Map();
    const connections = [];
    // Step 1: Extract all exported classes and functions
    files.forEach(file => {
        const sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true);
        ts.forEachChild(sourceFile, node => {
            // Check for exported class declarations
            if (ts.isClassDeclaration(node) && node.name && isNodeExported(node)) {
                const name = node.name.text;
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart());
                exportMap.set(name, { file: file.path, line: line + 1 });
            }
            // Check for exported function declarations
            if (ts.isFunctionDeclaration(node) && node.name && isNodeExported(node)) {
                const name = node.name.text;
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart());
                exportMap.set(name, { file: file.path, line: line + 1 });
            }
        });
    });
    // Step 2: Find usages of these exports in other files
    files.forEach(file => {
        const sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true);
        const importMap = new Map(); // Imported name -> original name
        // First, process import declarations to map imported names
        ts.forEachChild(sourceFile, node => {
            if (ts.isImportDeclaration(node) && node.importClause && node.moduleSpecifier) {
                const modulePath = node.moduleSpecifier.text;
                const resolvedModulePath = resolveModulePath(file.path, modulePath, files);
                if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
                    node.importClause.namedBindings.elements.forEach(element => {
                        const importedName = element.name.text;
                        const originalName = element.propertyName ? element.propertyName.text : element.name.text;
                        importMap.set(importedName, originalName);
                    });
                }
                // Handle default imports if necessary
                if (node.importClause.name) {
                    const importedName = node.importClause.name.text;
                    importMap.set(importedName, 'default');
                }
            }
        });
        // Now, traverse the AST to find usages
        function visit(node) {
            if (ts.isIdentifier(node)) {
                const identifierName = node.text;
                if (importMap.has(identifierName)) {
                    const originalName = importMap.get(identifierName);
                    if (exportMap.has(originalName)) {
                        const definition = exportMap.get(originalName);
                        const { line: usageLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        connections.push({
                            fromFile: file.path,
                            fromLine: usageLine + 1,
                            toFile: definition.file,
                            toLine: definition.line,
                            name: originalName
                        });
                    }
                }
            }
            ts.forEachChild(node, visit);
        }
        ts.forEachChild(sourceFile, visit);
    });
    return connections;
}
// Helper function to check if a node is exported
function isNodeExported(node) {
    return (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;
}
// Helper function to resolve module paths
function resolveModulePath(currentFilePath, modulePath, files) {
    // Handle relative paths
    if (modulePath.startsWith('.')) {
        const dir = path.dirname(currentFilePath);
        let fullPath = path.resolve(dir, modulePath);
        // Append .ts extension if not present
        if (!fullPath.endsWith('.ts')) {
            fullPath += '.ts';
        }
        // Check if the resolved path exists in files
        const found = files.find(f => path.resolve(f.path) === fullPath);
        if (found) {
            return found.path;
        }
    }
    // For non-relative paths, additional resolution logic can be added here
    return '';
}
