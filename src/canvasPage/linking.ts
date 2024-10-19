// linking.ts

import * as ts from 'typescript';
import * as path from 'path';

export interface FileInfo {
  path: string;      // Absolute path to the file
  content: string;   // Content of the file
}

export interface Connection {
  fromFile: string;  // File where the class/function is used
  fromLine: number;  // Line number in the fromFile where it's used
  toFile: string;    // File where the class/function is defined
  toLine: number;    // Line number in the toFile where it's defined
  name: string;      // Name of the class/function
}

export function createAdjacencyArray(files: FileInfo[]): Connection[] {
  const exportMap: Map<string, { file: string; line: number }> = new Map();
  const connections: Connection[] = [];

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
    const importMap: Map<string, string> = new Map(); // Imported name -> original name

    // First, process import declarations to map imported names
    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node) && node.importClause && node.moduleSpecifier) {
        const modulePath = (node.moduleSpecifier as ts.StringLiteral).text;
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
    function visit(node: ts.Node) {
      if (ts.isIdentifier(node)) {
        const identifierName = node.text;
        if (importMap.has(identifierName)) {
          const originalName = importMap.get(identifierName)!;

          if (exportMap.has(originalName)) {
            const definition = exportMap.get(originalName)!;
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
function isNodeExported(node: ts.Node): boolean {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
}

// Helper function to resolve module paths
function resolveModulePath(currentFilePath: string, modulePath: string, files: FileInfo[]): string {
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
