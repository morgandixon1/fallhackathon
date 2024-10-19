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
    console.log('Starting export extraction...');
    // Step 1: Extract all exported classes and functions
    files.forEach(file => {
        const sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true);
        ts.forEachChild(sourceFile, node => {
            // Check for exported class declarations
            if (ts.isClassDeclaration(node) && node.name && isNodeExported(node)) {
                const name = node.name.text;
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart());
                exportMap.set(name, { file: file.path, line: line + 1 });
                console.log(`Exported Class: ${name} in ${file.path} at line ${line + 1}`);
            }
            // Check for exported function declarations
            if (ts.isFunctionDeclaration(node) && node.name && isNodeExported(node)) {
                const name = node.name.text;
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.name.getStart());
                exportMap.set(name, { file: file.path, line: line + 1 });
                console.log(`Exported Function: ${name} in ${file.path} at line ${line + 1}`);
            }
            // Optionally, handle default exports
            if (ts.isExportAssignment(node) && !node.isExportEquals) {
                // Handle default exports
                const expr = node.expression;
                if (ts.isIdentifier(expr)) {
                    const name = expr.text;
                    exportMap.set('default', { file: file.path, line: 1 }); // Assuming line 1 for simplicity
                    console.log(`Exported Default: ${name} in ${file.path}`);
                }
            }
            // Optionally, handle exported variables or other types
            // Add similar blocks for variables, interfaces, etc., if needed
        });
    });
    console.log('Export extraction completed.');
    console.log('Starting usage detection...');
    // Step 2: Find usages of these exports in other files
    files.forEach(file => {
        const sourceFile = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true);
        const importMap = new Map(); // Imported name -> original name
        // First, process import declarations to map imported names
        ts.forEachChild(sourceFile, node => {
            if (ts.isImportDeclaration(node) && node.importClause && node.moduleSpecifier) {
                const modulePath = node.moduleSpecifier.text;
                const resolvedModulePath = resolveModulePath(file.path, modulePath, files);
                if (!resolvedModulePath) {
                    console.warn(`Could not resolve module path: ${modulePath} in file ${file.path}`);
                    return;
                }
                if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
                    node.importClause.namedBindings.elements.forEach(element => {
                        const importedName = element.name.text;
                        const originalName = element.propertyName ? element.propertyName.text : element.name.text;
                        importMap.set(importedName, originalName);
                        console.log(`Imported ${importedName} as ${originalName} from ${resolvedModulePath} in ${file.path}`);
                    });
                }
                // Handle default imports
                if (node.importClause.name) {
                    const importedName = node.importClause.name.text;
                    importMap.set(importedName, 'default');
                    console.log(`Imported default as ${importedName} from ${resolvedModulePath} in ${file.path}`);
                }
                // Handle namespace imports if needed
                // e.g., import * as Utils from './utils';
                // Currently not handled
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
                        console.log(`Connection found: ${file.path} (${usageLine + 1}) uses ${originalName} from ${definition.file} (${definition.line})`);
                    }
                    else {
                        console.warn(`Original name ${originalName} not found in exportMap.`);
                    }
                }
            }
            ts.forEachChild(node, visit);
        }
        ts.forEachChild(sourceFile, visit);
    });
    console.log('Usage detection completed.');
    console.log(`Total connections found: ${connections.length}`);
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
        // Check if the path is a directory with an index.ts
        if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) {
            const indexTs = path.join(fullPath, 'index.ts');
            const indexTsx = path.join(fullPath, 'index.tsx');
            if (files.find(f => path.resolve(f.path) === path.resolve(indexTs))) {
                fullPath = indexTs;
            }
            else if (files.find(f => path.resolve(f.path) === path.resolve(indexTsx))) {
                fullPath = indexTsx;
            }
        }
        // Append .ts extension if not present and not a directory
        if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) {
            fullPath += '.ts';
        }
        // Check if the resolved path exists in files
        const found = files.find(f => path.resolve(f.path) === fullPath);
        if (found) {
            return found.path;
        }
        else {
            console.warn(`Resolved module path does not exist: ${fullPath}`);
            return '';
        }
    }
    // For non-relative paths, additional resolution logic can be added here
    // e.g., handling node_modules or aliases
    console.warn(`Non-relative module paths are not handled: ${modulePath}`);
    return '';
}
