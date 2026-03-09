// webview/src/App.tsx
import React, { useState } from 'react';

const App: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to Compare');

  const handleCompare = () => {
    setStatus('Analyzing...');
    // Send message to Extension Host
    window.vscodeApi.postMessage({
      command: 'analyzeUX',
      text: 'Comparing current file with reference screenshot...'
    });
  };

  return (
    <div style={{ padding: '20px', color: 'var(--vscode-foreground)' }}>
      <h2>UX-Vision QA</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={handleCompare}
          style={{ 
            backgroundColor: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            border: 'none',
            padding: '8px 12px',
            cursor: 'pointer'
          }}
        >
          Run UX Audit
        </button>
      </div>
      <p>Status: <strong>{status}</strong></p>
    </div>
  );
};

export default App;