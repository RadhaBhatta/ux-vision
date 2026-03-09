"use strict";
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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
function activate(context) {
    let disposable = vscode.commands.registerCommand('ux-vision.start', () => {
        const panel = vscode.window.createWebviewPanel('uxVision', 'UX-Vision Analysis', vscode.ViewColumn.Two, {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))]
        });
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
function getWebviewContent(context, webview) {
    // In production, point to the bundled dist/index.html
    // For dev, you can point to the Vite dev server (localhost:5173)
    const scriptUri = webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist', 'assets', 'index.js')));
    return `<!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"></head>
        <body>
            <div id="root"></div>
            <script type="module" src="${scriptUri}"></script>
        </body>
        </html>`;
}
