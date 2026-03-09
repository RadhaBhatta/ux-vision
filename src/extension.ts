import * as vscode from "vscode";
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. Initialize Gemini Utility
const setupGemini = (apiKey: string) => {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
};

export function activate(context: vscode.ExtensionContext) {
  // Use a secret or a hardcoded key for now
  const model = setupGemini("AIzaSyCIvAg_B6rWMVjjpVnvse2XEtAC7kl1zac");

  // 2. Register the Sidebar Provider
  const provider = {
    resolveWebviewView: (webviewView: vscode.WebviewView) => {
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

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("uxVisionView", provider)
  );
}

// 3. Functional Analysis Logic
async function performAnalysis(model: any, base64Image: string, webviewView: vscode.WebviewView) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

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
  } catch (err: any) {
    vscode.window.showErrorMessage("Gemini Error: " + err.message);
  }
}

// 4. HTML Generator Function
function getHtml(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, "webview", "dist", "bundle.js"));
  return `<html><body><div id="root"></div><script src="${scriptUri}"></script></body></html>`;
}