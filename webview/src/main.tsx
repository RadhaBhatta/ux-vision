// webview/src/main.tsx
declare global {
  interface Window {
    vscodeApi: {
      postMessage: (message: any) => void;
    };
  }
}
window.vscodeApi = (window as any).acquireVsCodeApi();