import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('ux-vision.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'uxVision',
            'UX-Vision Analysis',
            vscode.ViewColumn.Two,
            { 
                enableScripts: true,
                localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))]
            }
        );

        panel.webview.html = getWebviewContent(context, panel.webview);

        // Handle messages from React
        panel.webview.onDidReceiveMessage(message => {
            if (message.command === 'analyzeUX') {
                vscode.window.showInformationMessage(`UX-Vision: ${message.text}`);
            }
        });
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent(context: vscode.ExtensionContext, webview: vscode.Webview) {
    // In production, point to the bundled dist/index.html
    // For dev, you can point to the Vite dev server (localhost:5173)
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(
        path.join(context.extensionPath, 'webview', 'dist', 'assets', 'index.js')
    ));

    
    return `<!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"></head>
        <body>
            <div id="root"></div>
            <script type="module" src="${scriptUri}"></script>
        </body>
        </html>`;
}