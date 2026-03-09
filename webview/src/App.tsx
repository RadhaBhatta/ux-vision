import React, { useState, useEffect } from 'react';

/**
 * Access the VS Code API.
 * In a Vite setup, we ensure this is available globally.
 */
const vscode = (window as any).acquireVsCodeApi();

interface UXIssue {
  issue: string;
  severity: 'High' | 'Medium' | 'Low';
  currentCode: string;
  suggestedFix: string;
}

const App: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [issues, setIssues] = useState<UXIssue[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Listen for messages from extension.ts
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.command === 'analysis-result') {
        setLoading(false);
        try {
          // Clean the AI response in case it includes markdown wrappers
          const cleanJson = message.text.replace(/```json|```/g, '').trim();
          setIssues(JSON.parse(cleanJson));
        } catch (err) {
          console.error("Failed to parse Gemini JSON:", err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setLoading(true);

      // Send input to Gemini via the Extension Host
      vscode.postMessage({
        command: 'analyze-ui',
        imageData: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const requestFix = (code: string) => {
    vscode.postMessage({
      command: 'apply-fix',
      code: code
    });
  };

  return (
    <div className="ux-vision-app">
      <header>
        <h3>UX-Vision Audit</h3>
      </header>

      <div className="upload-zone">
        <input 
          type="file" 
          id="file-upload" 
          accept="image/*" 
          onChange={onFileUpload} 
          hidden 
        />
        <label htmlFor="file-upload" className="upload-btn">
          {loading ? 'Processing...' : 'Upload Screenshot'}
        </label>
      </div>

      {previewImage && (
        <div className="preview-box">
          <img src={previewImage} alt="Preview" />
        </div>
      )}

      

      <main className="results-container">
        {loading && <div className="status">AI is analyzing your UI...</div>}
        
        {issues.map((item, idx) => (
          <div key={idx} className={`issue-card ${item.severity.toLowerCase()}`}>
            <div className="card-header">
              <span className="badge">{item.severity}</span>
              <strong>{item.issue}</strong>
            </div>
            <pre>
              <code>{item.suggestedFix}</code>
            </pre>
            <button onClick={() => requestFix(item.suggestedFix)}>
              Apply Fix
            </button>
          </div>
        ))}
      </main>

      <style>{`
        .ux-vision-app { font-family: var(--vscode-font-family); color: var(--vscode-foreground); padding: 10px; }
        .upload-btn { 
          display: block; width: 100%; padding: 8px; text-align: center;
          background: var(--vscode-button-background); color: var(--vscode-button-foreground);
          cursor: pointer; border-radius: 2px;
        }
        .upload-btn:hover { background: var(--vscode-button-hoverBackground); }
        .preview-box img { width: 100%; margin-top: 10px; border: 1px solid var(--vscode-widget-border); }
        .issue-card { 
          margin-top: 15px; padding: 10px; border-radius: 4px;
          background: var(--vscode-sideBar-background); border: 1px solid var(--vscode-widget-border);
        }
        .high { border-left: 4px solid var(--vscode-errorForeground); }
        .medium { border-left: 4px solid var(--vscode-warningForeground); }
        .low { border-left: 4px solid var(--vscode-infoForeground); }
        .badge { font-size: 0.7rem; background: var(--vscode-badge-background); padding: 2px 4px; margin-right: 5px; }
        pre { background: #1e1e1e; padding: 5px; overflow-x: auto; font-size: 0.8rem; }
        button { width: 100%; margin-top: 5px; cursor: pointer; background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); border: none; padding: 4px; }
      `}</style>
    </div>
  );
};

export default App;