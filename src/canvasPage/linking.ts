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
    const importMap: Map<string, string> = new Map(); // Imported name -> original name

    // First, process import declarations to map imported names
    ts.forEachChild(sourceFile, node => {
      if (ts.isImportDeclaration(node) && node.importClause && node.moduleSpecifier) {
        const modulePath = (node.moduleSpecifier as ts.StringLiteral).text;
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

            console.log(`Connection found: ${file.path} (${usageLine + 1}) uses ${originalName} from ${definition.file} (${definition.line})`);
          } else {
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
function isNodeExported(node: ts.Node): boolean {
  return (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0;
}

// Helper function to resolve module paths
function resolveModulePath(currentFilePath: string, modulePath: string, files: FileInfo[]): string {
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
      } else if (files.find(f => path.resolve(f.path) === path.resolve(indexTsx))) {
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
    } else {
      console.warn(`Resolved module path does not exist: ${fullPath}`);
      return '';
    }
  }

  // For non-relative paths, additional resolution logic can be added here
  // e.g., handling node_modules or aliases
  console.warn(`Non-relative module paths are not handled: ${modulePath}`);
  return '';
}
