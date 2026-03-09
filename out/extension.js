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
const generative_ai_1 = require("@google/generative-ai");
// 1. Initialize Gemini Utility
const setupGemini = (apiKey) => {
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
};
function activate(context) {
    // Use a secret or a hardcoded key for now
    const model = setupGemini("AIzaSyCIvAg_B6rWMVjjpVnvse2XEtAC7kl1zac");
    // 2. Register the Sidebar Provider
    const provider = {
        resolveWebviewView: (webviewView) => {
            webviewView.webview.options = { enableScripts: true };
            webviewView.webview.html = getHtml(webviewView.webview, context.extensionUri);
            // Handle messages from React
            webviewView.webview.onDidReceiveMessage(async (msg) => {
                if (msg.command === "analyze-ui") {
                    await performAnalysis(model, msg.imageData, webviewView);
                }
            });
        }
    };
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("uxVisionView", provider));
}
// 3. Functional Analysis Logic
async function performAnalysis(model, base64Image, webviewView) {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return;
    try {
        const prompt = "Compare this UI screenshot to this code. List UX discrepancies in JSON format.";
        const imagePart = {
            inlineData: { data: base64Image.split(",")[1], mimeType: "image/png" }
        };
        const result = await model.generateContent([prompt, imagePart, editor.document.getText()]);
        const response = await result.response;
        webviewView.webview.postMessage({
            command: "analysis-result",
            text: response.text()
        });
    }
    catch (err) {
        vscode.window.showErrorMessage("Gemini Error: " + err.message);
    }
}
// 4. HTML Generator Function
function getHtml(webview, extensionUri) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview", "dist", "bundle.js"));
    return `<html><body><div id="root"></div><script src="${scriptUri}"></script></body></html>`;
}
