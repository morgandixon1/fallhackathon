import * as vscode from 'vscode';
import { openCanvasPage } from './canvasPage';

class CanvasTreeDataProvider implements vscode.TreeDataProvider<CanvasItem> {
  getTreeItem(element: CanvasItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: CanvasItem): Thenable<CanvasItem[]> {
    if (element) {
      return Promise.resolve([]);
    } else {
      return Promise.resolve([
        new CanvasItem('Open Canvas', vscode.TreeItemCollapsibleState.None, {
          command: 'extension.openCanvas',
          title: 'Open Canvas',
          arguments: []
        })
      ]);
    }
  }
}

class CanvasItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    this.description = '';
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Activating 2D Canvas Extension');

  const treeDataProvider = new CanvasTreeDataProvider();
  vscode.window.registerTreeDataProvider('canvasExplorer', treeDataProvider);

  const disposable = vscode.commands.registerCommand('extension.openCanvas', () => {
    console.log('openCanvas command triggered');
    openCanvasPage(context).catch(error => {
      console.error('Error in openCanvasPage:', error);
      vscode.window.showErrorMessage('Failed to open canvas page: ' + (error instanceof Error ? error.message : String(error)));
    });
  });

  context.subscriptions.push(disposable);

  console.log('2D Canvas Extension Activated');
}

export function deactivate() {
  console.log('2D Canvas Extension Deactivated');
}
