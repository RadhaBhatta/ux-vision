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
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
/**
 * Helper: Converts the Base64 string from React into the
 * Uint8Array required by the VS Code Language Model API.
 */
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
function activate(context) {
    // 1. Register the Start Command
    let disposable = vscode.commands.registerCommand('ux-vision.start', () => {
        const panel = vscode.window.createWebviewPanel('uxVision', 'UX-Vision Dashboard', vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'webview', 'dist'))
            ]
        });
        // 2. Set the HTML Content
        panel.webview.html = getWebviewContent(panel.webview, context);
        // 3. Handle messages from React
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'analyzeUX') {
                await handleVisionAnalysis(panel, message);
            }
        }, undefined, context.subscriptions);
    });
    context.subscriptions.push(disposable);
}
async function handleVisionAnalysis(panel, data) {
    try {
        const [model] = await vscode.lm.selectChatModels({ vendor: 'copilot', family: 'gpt-4o' });
        // Prepare the binary image data
        const rawBase64 = data.screenshot.split(',')[1];
        const imageData = base64ToUint8Array(rawBase64);
        const messages = [
            vscode.LanguageModelChatMessage.User([
                new vscode.LanguageModelTextPart(`Compare this UI screenshot with this code:\n${data.code}`),
                // Correct 2026 API usage
                new vscode.LanguageModelDataPart(imageData, 'image/png')
            ])
        ];
        const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
        for await (const fragment of response.text) {
            panel.webview.postMessage({ command: 'aiDelta', data: fragment });
        }
    }
    catch (err) {
        vscode.window.showErrorMessage("Vision Error: " + err.message);
    }
}
function getWebviewContent(webview, context) {
    // Convert local paths to Webview URIs
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist', 'assets', 'index.js'));
    // const styleUri = webview.asWebviewUri(
    //     vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist', 'assets', 'index.css')
    // );
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>UX-Vision</title>
    </head>
    <body>
        <div id="root"></div>
        <script type="module" src="${scriptUri}"></script>
    </body>
    </html>`;
}
function deactivate() { }
