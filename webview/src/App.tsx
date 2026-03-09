import React, { useState, useEffect } from 'react';

/**
 * Access the VS Code API. 
 * Note: acquireVsCodeApi can only be called once in the lifetime of the webview.
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

  // 1. Listen for messages from the Extension Host (extension.ts)
  useEffect(() => {
    const messageListener = (event: MessageEvent) => {
      const message = event.data;

      switch (message.command) {
        case 'analysis-result':
          setLoading(false);
          try {
            // Gemini might return JSON inside markdown blocks
            const cleanJson = message.text.replace(/```json|```/g, '').trim();
            const parsed: UXIssue[] = JSON.parse(cleanJson);
            setIssues(parsed);
          } catch (err) {
            console.error("Failed to parse Gemini response:", err);
          }
          break;
      }
    };

    window.addEventListener('message', messageListener);
    return () => window.removeEventListener('message', messageListener);
  }, []);

  // 2. Handle Image Upload and send to Gemini
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setLoading(true);

      // Send the image to extension.ts to trigger Gemini API
      vscode.postMessage({
        command: 'analyze-ui',
        imageData: base64
      });
    };
    reader.readAsDataURL(file);
  };

  // 3. Request the extension host to apply a fix
  const applyFix = (codeSnippet: string) => {
    vscode.postMessage({
      command: 'apply-fix',
      code: codeSnippet
    });
  };

  return (
    <div className="container">
      <header>
        <h1>UX-Vision Audit</h1>
        <p>Compare design screenshots with your source code using Gemini 1.5 Pro.</p>
      </header>

      <section className="upload-section">
        <label className="file-input-label">
          {loading ? 'Analyzing...' : 'Upload Design Screenshot'}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            disabled={loading} 
          />
        </label>
      </section>

      {previewImage && (
        <div className="preview-container">
          <img src={previewImage} alt="Design Preview" className="preview-img" />
        </div>
      )}

      
      
      <section className="results-section">
        {loading && <div className="loader">Gemini is inspecting your UI...</div>}
        
        {!loading && issues.length > 0 && (
          <div className="issues-list">
            <h3>Discrepancies Found ({issues.length})</h3>
            {issues.map((item, index) => (
              <div key={index} className={`issue-card ${item.severity.toLowerCase()}`}>
                <div className="issue-header">
                  <span className="severity-badge">{item.severity}</span>
                  <strong>{item.issue}</strong>
                </div>
                <div className="code-diff">
                  <p>Suggested Fix:</p>
                  <code>{item.suggestedFix}</code>
                </div>
                <button 
                  className="fix-btn" 
                  onClick={() => applyFix(item.suggestedFix)}
                >
                  Apply Fix
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        .container { padding: 15px; color: var(--vscode-foreground); font-family: var(--vscode-font-family); }
        h1 { font-size: 1.2rem; margin-bottom: 5px; }
        .upload-section { margin: 20px 0; }
        .file-input-label {
          display: block;
          padding: 10px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          text-align: center;
          cursor: pointer;
          border-radius: 4px;
        }
        .file-input-label:hover { background: var(--vscode-button-hoverBackground); }
        input[type="file"] { display: none; }
        .preview-img { width: 100%; border-radius: 4px; margin-top: 10px; border: 1px solid var(--vscode-widget-border); }
        .issue-card { 
          background: var(--vscode-editor-background);
          border: 1px solid var(--vscode-widget-border);
          padding: 12px;
          margin-bottom: 12px;
          border-radius: 4px;
        }
        .high { border-left: 4px solid var(--vscode-notificationsErrorIcon-foreground); }
        .medium { border-left: 4px solid var(--vscode-notificationsWarningIcon-foreground); }
        .low { border-left: 4px solid var(--vscode-notificationsInfoIcon-foreground); }
        .severity-badge { font-size: 10px; padding: 2px 5px; border-radius: 3px; background: var(--vscode-badge-background); margin-right: 8px; vertical-align: middle; }
        code { display: block; background: #000; padding: 5px; margin-top: 5px; font-size: 11px; white-space: pre-wrap; }
        .fix-btn {
          margin-top: 10px;
          width: 100%;
          background: var(--vscode-button-secondaryBackground);
          color: var(--vscode-button-secondaryForeground);
          border: none;
          padding: 5px;
          cursor: pointer;
        }
        .fix-btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
      `}</style>
    </div>
  );
};

export default App;