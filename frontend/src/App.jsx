import { useState, useCallback, useRef, useEffect } from "react";

const COLORS = {
  bg: "#0C0C0C",
  surface: "#141414",
  border: "#222222",
  borderHover: "#333333",
  accent: "#C8FF00",
  accentDim: "#8FB800",
  error: "#FF4545",
  errorDim: "#3D1212",
  success: "#C8FF00",
  successDim: "#1A2200",
  text: "#E8E8E8",
  textMuted: "#666666",
  textDim: "#999999",
};

const TYPE_COLORS = {
  json: "#F0A500",
  yaml: "#7B61FF",
  python: "#3B8EEA",
  xml: "#FF6B35",
  html: "#E34C26",
  csv: "#00C49A",
  toml: "#9B59B6",
  sql: "#00B4D8",
  markdown: "#74B9FF",
  env: "#FD79A8",
  dockerfile: "#0DB7ED",
  plaintext: "#888888",
  unknown: "#555555",
};

const FILE_ICONS = {
  json: "{ }",
  yaml: "~~~",
  python: ">>>",
  xml: "</>",
  html: "<>",
  csv: "|||",
  toml: "[T]",
  sql: "SQL",
  markdown: "###",
  env: ".env",
  dockerfile: "🐳",
  plaintext: "TXT",
  unknown: "???",
};

const SUPPORTED_TYPES = ["json", "yaml", "python", "xml", "html", "csv", "toml", "sql", "markdown", "env"];

const TYPE_PLACEHOLDERS = {
  json: '{\n  "name": "filelint",\n  "version": "1.0",\n  "active": true\n}',
  yaml: 'name: filelint\nversion: 1.0\nactive: true',
  python: 'def hello():\n    print("Hello, world!")\n\nhello()',
  xml: '<root>\n  <item id="1">Hello</item>\n</root>',
  html: '<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello</h1>\n  </body>\n</html>',
  csv: 'name,age,city\nAlice,30,NYC\nBob,25,LA',
  toml: '[database]\nhost = "localhost"\nport = 5432',
  sql: 'SELECT id, name\nFROM users\nWHERE active = true;',
  markdown: '# Hello\n\nThis is **bold** and _italic_ text.',
  env: 'APP_NAME=filelint\nAPI_KEY=your_key_here\nDEBUG=false',
  auto: '// Paste any file content here\n// Type will be detected automatically',
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&family=Outfit:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: ${COLORS.bg};
    color: ${COLORS.text};
    font-family: 'Outfit', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .mono { font-family: 'Syne Mono', monospace; }

  .app {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    position: relative;
    overflow: hidden;
  }

  .app::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(${COLORS.border} 1px, transparent 1px),
      linear-gradient(90deg, ${COLORS.border} 1px, transparent 1px);
    background-size: 48px 48px;
    opacity: 0.4;
    pointer-events: none;
    z-index: 0;
  }

  .app::after {
    content: '';
    position: fixed;
    top: -200px;
    left: -200px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, ${COLORS.accent}18 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  header {
    position: relative;
    z-index: 10;
    padding: 32px 48px 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  .logo { display: flex; flex-direction: column; gap: 2px; }

  .logo-mark {
    font-family: 'Syne Mono', monospace;
    font-size: 22px;
    color: ${COLORS.accent};
    letter-spacing: -1px;
    line-height: 1;
  }

  .logo-sub {
    font-size: 11px;
    color: ${COLORS.textMuted};
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: 500;
  }

  .status-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 999px;
    padding: 6px 14px;
    font-size: 12px;
    color: ${COLORS.textMuted};
    font-weight: 500;
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${COLORS.accent};
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  main {
    position: relative;
    z-index: 10;
    padding: 48px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: start;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }

  .left-panel { display: flex; flex-direction: column; gap: 20px; }

  .panel-label {
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: ${COLORS.textMuted};
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .panel-label::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${COLORS.border};
  }

  /* Mode Toggle */
  .mode-toggle {
    display: flex;
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 4px;
    padding: 4px;
    gap: 4px;
  }

  .mode-btn {
    flex: 1;
    padding: 8px 16px;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: ${COLORS.textMuted};
    font-family: 'Syne Mono', monospace;
    font-size: 12px;
    letter-spacing: 1px;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .mode-btn:hover { color: ${COLORS.text}; }

  .mode-btn.active {
    background: ${COLORS.accent}18;
    color: ${COLORS.accent};
    border: 1px solid ${COLORS.accent}40;
  }

  /* Drop Zone */
  .drop-zone {
    border: 1.5px dashed ${COLORS.border};
    border-radius: 4px;
    background: ${COLORS.surface};
    padding: 64px 32px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .drop-zone::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, ${COLORS.accent}08 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .drop-zone:hover::before,
  .drop-zone.dragging::before { opacity: 1; }

  .drop-zone:hover,
  .drop-zone.dragging {
    border-color: ${COLORS.accent};
    border-style: solid;
  }

  .drop-zone.dragging { transform: scale(1.01); }

  .drop-icon {
    font-family: 'Syne Mono', monospace;
    font-size: 36px;
    color: ${COLORS.textMuted};
    margin-bottom: 20px;
    display: block;
    transition: color 0.2s, transform 0.2s;
  }

  .drop-zone:hover .drop-icon,
  .drop-zone.dragging .drop-icon {
    color: ${COLORS.accent};
    transform: translateY(-4px);
  }

  .drop-title {
    font-size: 18px;
    font-weight: 600;
    color: ${COLORS.text};
    margin-bottom: 8px;
  }

  .drop-subtitle {
    font-size: 13px;
    color: ${COLORS.textMuted};
    line-height: 1.6;
  }

  .drop-types {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
    margin-top: 24px;
  }

  .type-chip {
    font-family: 'Syne Mono', monospace;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 2px;
    border: 1px solid;
    letter-spacing: 1px;
  }

  /* Paste Editor */
  .paste-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .paste-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .type-select {
    flex: 1;
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    color: ${COLORS.text};
    font-family: 'Syne Mono', monospace;
    font-size: 12px;
    padding: 8px 12px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    letter-spacing: 1px;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }

  .type-select:focus { border-color: ${COLORS.accent}; }
  .type-select option { background: #1A1A1A; }

  .validate-btn {
    background: ${COLORS.accent};
    color: #000;
    border: none;
    font-family: 'Syne Mono', monospace;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    padding: 8px 20px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    text-transform: uppercase;
  }

  .validate-btn:hover { background: #AADD00; transform: translateY(-1px); }
  .validate-btn:active { transform: translateY(0); }
  .validate-btn:disabled {
    background: ${COLORS.border};
    color: ${COLORS.textMuted};
    cursor: not-allowed;
    transform: none;
  }

  .clear-btn {
    background: transparent;
    border: 1px solid ${COLORS.border};
    color: ${COLORS.textMuted};
    font-family: 'Syne Mono', monospace;
    font-size: 11px;
    padding: 8px 12px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 1px;
  }

  .clear-btn:hover { border-color: ${COLORS.error}; color: ${COLORS.error}; }

  .code-textarea {
    width: 100%;
    min-height: 320px;
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 4px;
    color: #B8D4A0;
    font-family: 'Syne Mono', monospace;
    font-size: 12px;
    line-height: 1.7;
    padding: 20px;
    resize: vertical;
    outline: none;
    transition: border-color 0.2s;
    white-space: pre;
    overflow-wrap: normal;
    overflow-x: auto;
  }

  .code-textarea:focus { border-color: ${COLORS.accent}40; }
  .code-textarea::placeholder { color: ${COLORS.textMuted}; opacity: 0.5; }

  .code-textarea::-webkit-scrollbar { width: 4px; height: 4px; }
  .code-textarea::-webkit-scrollbar-track { background: transparent; }
  .code-textarea::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }

  .auto-validate-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: ${COLORS.textMuted};
    font-family: 'Syne Mono', monospace;
    letter-spacing: 1px;
  }

  .auto-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: ${COLORS.accent};
  }

  .auto-dot.validating {
    animation: pulse 0.6s infinite;
  }

  /* File Card */
  .file-card {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 4px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: relative;
    overflow: hidden;
  }

  .file-type-badge {
    font-family: 'Syne Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    min-width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    border: 1px solid;
    letter-spacing: 1px;
    flex-shrink: 0;
  }

  .file-info { flex: 1; min-width: 0; }

  .file-name {
    font-size: 14px;
    font-weight: 600;
    color: ${COLORS.text};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }

  .file-meta {
    font-size: 12px;
    color: ${COLORS.textMuted};
    display: flex;
    gap: 12px;
  }

  .mismatch-badge {
    background: #3D1A00;
    color: #FF8C42;
    border: 1px solid #FF8C4240;
    font-size: 10px;
    font-family: 'Syne Mono', monospace;
    padding: 2px 8px;
    border-radius: 2px;
    letter-spacing: 1px;
    align-self: center;
  }

  /* Right Panel */
  .right-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    position: sticky;
    top: 48px;
  }

  .result-card {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 4px;
    overflow: hidden;
  }

  .result-header {
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid ${COLORS.border};
  }

  .result-status-icon {
    font-family: 'Syne Mono', monospace;
    font-size: 18px;
    font-weight: 700;
  }

  .result-title { font-size: 14px; font-weight: 600; flex: 1; }

  .result-count {
    font-family: 'Syne Mono', monospace;
    font-size: 11px;
    color: ${COLORS.textMuted};
    letter-spacing: 1px;
  }

  .errors-list {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .error-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: ${COLORS.errorDim};
    border: 1px solid ${COLORS.error}30;
    border-radius: 3px;
    padding: 10px 14px;
  }

  .error-bullet {
    color: ${COLORS.error};
    font-family: 'Syne Mono', monospace;
    font-size: 12px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .error-text {
    font-size: 13px;
    color: #FF9090;
    line-height: 1.5;
    font-family: 'Syne Mono', monospace;
  }

  .formatted-section { border-top: 1px solid ${COLORS.border}; }

  .formatted-header {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${COLORS.border};
  }

  .formatted-label {
    font-size: 11px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: ${COLORS.textMuted};
    font-weight: 600;
  }

  .btn-row { display: flex; gap: 8px; }

  .copy-btn {
    background: transparent;
    border: 1px solid ${COLORS.border};
    color: ${COLORS.textMuted};
    font-size: 11px;
    padding: 4px 12px;
    border-radius: 3px;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 0.15s;
  }

  .copy-btn:hover { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .copy-btn.copied {
    border-color: ${COLORS.accent};
    color: ${COLORS.accent};
    background: ${COLORS.successDim};
  }

  .download-btn {
    background: transparent;
    border: 1px solid ${COLORS.border};
    color: ${COLORS.textMuted};
    font-size: 11px;
    padding: 4px 12px;
    border-radius: 3px;
    cursor: pointer;
    font-family: 'Outfit', sans-serif;
    font-weight: 500;
    letter-spacing: 1px;
    text-transform: uppercase;
    transition: all 0.15s;
  }

  .download-btn:hover { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }

  .code-block {
    padding: 20px;
    font-family: 'Syne Mono', monospace;
    font-size: 12px;
    line-height: 1.7;
    color: #B8D4A0;
    overflow-x: auto;
    white-space: pre;
    max-height: 360px;
    overflow-y: auto;
    background: #0A0A0A;
  }

  .code-block::-webkit-scrollbar { width: 4px; height: 4px; }
  .code-block::-webkit-scrollbar-track { background: transparent; }
  .code-block::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }

  .valid-banner {
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    background: ${COLORS.successDim};
  }

  .valid-icon { font-family: 'Syne Mono', monospace; font-size: 24px; color: ${COLORS.accent}; }
  .valid-text { font-size: 14px; color: #A8D060; font-weight: 500; }
  .valid-subtext { font-size: 12px; color: #5A7A30; margin-top: 2px; }

  .fix-notice {
    padding: 12px 20px;
    background: #0D1A00;
    border-top: 1px solid #C8FF0020;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #7AAD30;
    font-family: 'Syne Mono', monospace;
    letter-spacing: 0.5px;
  }

  .fix-badge {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 2px;
    letter-spacing: 1px;
    font-family: 'Syne Mono', monospace;
    border: 1px solid;
  }

  .fix-badge-ai { background: #1A0D3D; color: #A78BFF; border-color: #A78BFF40; }
  .fix-badge-rule { background: #0D2200; color: #C8FF00; border-color: #C8FF0040; }

  .fix-error-notice {
    padding: 12px 20px;
    background: #1A1000;
    border-top: 1px solid #FF8C4220;
    font-size: 12px;
    color: #AA6030;
    font-family: 'Syne Mono', monospace;
  }

  .empty-state {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 4px;
    padding: 48px 32px;
    text-align: center;
  }

  .empty-icon { font-family: 'Syne Mono', monospace; font-size: 32px; color: ${COLORS.border}; margin-bottom: 16px; }
  .empty-title { font-size: 15px; font-weight: 600; color: ${COLORS.textMuted}; margin-bottom: 6px; }
  .empty-sub { font-size: 13px; color: #333; }

  .loading-card {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.border};
    border-radius: 4px;
    padding: 40px;
    text-align: center;
  }

  .spinner {
    font-family: 'Syne Mono', monospace;
    font-size: 28px;
    color: ${COLORS.accent};
    animation: spin 0.8s linear infinite;
    display: inline-block;
    margin-bottom: 16px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .loading-text {
    font-size: 13px;
    color: ${COLORS.textMuted};
    font-family: 'Syne Mono', monospace;
    letter-spacing: 2px;
  }

  .file-input { display: none; }

  footer {
    position: relative;
    z-index: 10;
    padding: 20px 48px;
    border-top: 1px solid ${COLORS.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-text {
    font-size: 11px;
    color: #333;
    font-family: 'Syne Mono', monospace;
    letter-spacing: 1px;
  }

  .footer-accent { color: ${COLORS.accent}; }

  .fade-in {
    animation: fadeIn 0.3s ease forwards;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 900px) {
    main { grid-template-columns: 1fr; padding: 24px; }
    header { padding: 24px; }
    footer { padding: 16px 24px; }
    .right-panel { position: static; }
  }
`;

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  // Mode: "drop" or "paste"
  const [mode, setMode] = useState("drop");

  // Shared state
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Drop mode state
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  // Paste mode state
  const [pasteContent, setPasteContent] = useState("");
  const [pasteType, setPasteType] = useState("auto");
  const [isAutoValidating, setIsAutoValidating] = useState(false);
  const debounceRef = useRef(null);

  const getOutputContent = () => {
    if (!result) return null;
    if (result.fix?.fixed && !result.validation?.valid) return result.fix.fixed;
    return result.validation?.formatted || null;
  };

  // ── File upload handler ───────────────────────────────────────────────────
  const processFile = useCallback(async (uploadedFile) => {
    setFile(uploadedFile);
    setResult(null);
    setError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const res = await fetch(`${API_URL}/fix`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Validation failed");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Paste validate handler ────────────────────────────────────────────────
  const validatePaste = useCallback(async (content, type) => {
    if (!content.trim()) {
      setResult(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/validate-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, file_type: type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Validation failed");
      }
      setResult(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsAutoValidating(false);
    }
  }, []);

  // ── Auto-validate with debounce ───────────────────────────────────────────
  useEffect(() => {
    if (mode !== "paste") return;
    if (!pasteContent.trim()) { setResult(null); return; }

    setIsAutoValidating(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      validatePaste(pasteContent, pasteType);
    }, 800);

    return () => clearTimeout(debounceRef.current);
  }, [pasteContent, pasteType, mode, validatePaste]);

  // ── Drag and drop handlers ────────────────────────────────────────────────
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  }, [processFile]);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleFileInput = (e) => { if (e.target.files[0]) processFile(e.target.files[0]); };

  // ── Copy / Download ───────────────────────────────────────────────────────
  const handleCopy = () => {
    const content = getOutputContent();
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const content = getOutputContent();
    if (!content) return;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const type = result?.detection?.detected_type || "file";
    const prefix = result?.fix?.fixed && !result?.validation?.valid ? "fixed_" : "formatted_";
    const filename = mode === "paste" ? `${prefix}pasted.${type}` : `${prefix}${file?.name || "file"}`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Switch mode — reset state ─────────────────────────────────────────────
  const switchMode = (newMode) => {
    setMode(newMode);
    setResult(null);
    setError(null);
    setFile(null);
    setPasteContent("");
    setIsAutoValidating(false);
    clearTimeout(debounceRef.current);
  };

  const detectedType = result?.detection?.detected_type || "unknown";
  const typeColor = TYPE_COLORS[detectedType] || TYPE_COLORS.unknown;
  const outputContent = getOutputContent();
  const wasFixed = result?.fix?.fixed && !result?.validation?.valid;
  const hasInput = mode === "drop" ? !!file : pasteContent.trim().length > 0;

  return (
    <>
      <style>{styles}</style>
      <div className="app">
        <header>
          <div className="logo">
            <span className="logo-mark mono">FileLint/</span>
            <span className="logo-sub">Universal File Validator</span>
          </div>
          <div className="status-pill">
            <div className="status-dot" />
            API Connected
          </div>
        </header>

        <main>
          {/* ── LEFT PANEL ── */}
          <div className="left-panel">
            <div className="panel-label mono">01 — Input</div>

            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                className={`mode-btn ${mode === "drop" ? "active" : ""}`}
                onClick={() => switchMode("drop")}
              >
                ⬇ DROP FILE
              </button>
              <button
                className={`mode-btn ${mode === "paste" ? "active" : ""}`}
                onClick={() => switchMode("paste")}
              >
                ✎ PASTE CODE
              </button>
            </div>

            {/* DROP MODE */}
            {mode === "drop" && (
              <>
                <div
                  className={`drop-zone ${isDragging ? "dragging" : ""}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    onChange={handleFileInput}
                  />
                  <span className="drop-icon mono">⬇</span>
                  <div className="drop-title">Drop your file here</div>
                  <div className="drop-subtitle">
                    or click to browse<br />
                    Detects type automatically — no extension required
                  </div>
                  <div className="drop-types">
                    {SUPPORTED_TYPES.map(t => (
                      <span
                        key={t}
                        className="type-chip mono"
                        style={{
                          color: TYPE_COLORS[t],
                          borderColor: TYPE_COLORS[t] + "50",
                          background: TYPE_COLORS[t] + "10",
                        }}
                      >
                        {t.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* File card */}
                {file && (
                  <div className="file-card fade-in" style={{ borderColor: typeColor + "40" }}>
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: 3, background: typeColor,
                    }} />
                    <div
                      className="file-type-badge mono"
                      style={{ color: typeColor, borderColor: typeColor + "40", background: typeColor + "12" }}
                    >
                      {FILE_ICONS[detectedType] || "???"}
                    </div>
                    <div className="file-info">
                      <div className="file-name">{file.name}</div>
                      <div className="file-meta">
                        <span>{formatBytes(file.size)}</span>
                        {result?.detection && (
                          <span style={{ color: typeColor }}>
                            {result?.detection?.detected_type?.toUpperCase()}
                          </span>
                        )}
                        {result?.detection?.extension && result.detection.extension !== "none" && (
                          <span>.{result?.detection?.extension}</span>
                        )}
                      </div>
                    </div>
                    {result?.detection?.extension_mismatch && (
                      <div className="mismatch-badge">⚠ MISMATCH</div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* PASTE MODE */}
            {mode === "paste" && (
              <div className="paste-panel fade-in">
                {/* Toolbar */}
                <div className="paste-toolbar">
                  <select
                    className="type-select"
                    value={pasteType}
                    onChange={(e) => setPasteType(e.target.value)}
                  >
                    <option value="auto">AUTO DETECT</option>
                    {SUPPORTED_TYPES.map(t => (
                      <option key={t} value={t}>{t.toUpperCase()}</option>
                    ))}
                  </select>
                  <button
                    className="clear-btn"
                    onClick={() => { setPasteContent(""); setResult(null); setError(null); }}
                  >
                    CLEAR
                  </button>
                  <button
                    className="validate-btn"
                    onClick={() => validatePaste(pasteContent, pasteType)}
                    disabled={!pasteContent.trim() || isLoading}
                  >
                    VALIDATE
                  </button>
                </div>

                {/* Code textarea */}
                <textarea
                  className="code-textarea"
                  value={pasteContent}
                  onChange={(e) => setPasteContent(e.target.value)}
                  placeholder={TYPE_PLACEHOLDERS[pasteType] || TYPE_PLACEHOLDERS.auto}
                  spellCheck={false}
                />

                {/* Auto-validate indicator */}
                <div className="auto-validate-indicator">
                  <div className={`auto-dot ${isAutoValidating ? "validating" : ""}`} />
                  {isAutoValidating ? "AUTO-VALIDATING..." : pasteContent.trim() ? "AUTO-VALIDATE ON" : "PASTE CODE ABOVE"}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="right-panel">
            <div className="panel-label mono">02 — Results</div>

            {/* Empty state */}
            {!hasInput && !isLoading && (
              <div className="empty-state">
                <div className="empty-icon mono">[ ]</div>
                <div className="empty-title">No input yet</div>
                <div className="empty-sub mono" style={{ fontSize: 11, letterSpacing: 1 }}>
                  {mode === "drop" ? "DROP A FILE TO BEGIN" : "PASTE CODE TO BEGIN"}
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && !isAutoValidating && (
              <div className="loading-card fade-in">
                <div className="spinner mono">◌</div>
                <div className="loading-text">VALIDATING...</div>
              </div>
            )}

            {/* API Error */}
            {error && !isLoading && (
              <div className="result-card fade-in">
                <div className="result-header" style={{ borderColor: COLORS.error + "40" }}>
                  <span className="result-status-icon" style={{ color: COLORS.error }}>✕</span>
                  <span className="result-title">API Error</span>
                </div>
                <div className="errors-list">
                  <div className="error-item">
                    <span className="error-bullet">→</span>
                    <span className="error-text">{error}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Result */}
            {result && !isLoading && (
              <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Unsupported */}
                {!result.detection.is_supported && (
                  <div className="result-card">
                    <div className="result-header">
                      <span className="result-status-icon" style={{ color: "#888" }}>?</span>
                      <span className="result-title">Unsupported Type</span>
                    </div>
                    <div style={{ padding: "16px 20px" }}>
                      <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6 }}>
                        Detected as <span className="mono" style={{ color: typeColor }}>
                          {result.detection.detected_type}
                        </span> — no validator available for this type yet.
                      </p>
                    </div>
                  </div>
                )}

                {/* Extension mismatch */}
                {result.detection.extension_mismatch && (
                  <div className="result-card" style={{ borderColor: "#FF8C4240" }}>
                    <div className="result-header" style={{ background: "#1A0D00", borderColor: "#FF8C4230" }}>
                      <span className="result-status-icon" style={{ color: "#FF8C42" }}>!</span>
                      <span className="result-title" style={{ color: "#FF8C42" }}>Extension Mismatch</span>
                    </div>
                    <div style={{ padding: "14px 20px" }}>
                      <p style={{ fontSize: 13, color: "#CC7040", lineHeight: 1.6 }}>
                        File claims to be <span className="mono">.{result.detection.extension}</span> but
                        content reads as <span className="mono" style={{ color: typeColor }}>
                          {result.detection.detected_type}
                        </span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* Main result */}
                {result.detection.is_supported && (
                  <div className="result-card">
                    <div
                      className="result-header"
                      style={{
                        background: result.validation.valid ? COLORS.successDim : COLORS.errorDim,
                        borderColor: result.validation.valid ? COLORS.accent + "30" : COLORS.error + "30",
                      }}
                    >
                      <span className="result-status-icon"
                        style={{ color: result.validation.valid ? COLORS.accent : COLORS.error }}>
                        {result.validation.valid ? "✓" : "✕"}
                      </span>
                      <span className="result-title">
                        {result.validation.valid ? "Validation Passed" : "Validation Failed"}
                      </span>
                      {result.validation.errors.length > 0 && (
                        <span className="result-count mono">
                          {result.validation.errors.length} ERROR{result.validation.errors.length !== 1 ? "S" : ""}
                        </span>
                      )}
                    </div>

                    {/* Errors */}
                    {result.validation.errors.length > 0 && (
                      <div className="errors-list">
                        {result.validation.errors.map((err, i) => (
                          <div key={i} className="error-item">
                            <span className="error-bullet">→</span>
                            <span className="error-text">{err}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fix notice */}
                    {wasFixed && result.fix?.method && (
                      <div className="fix-notice">
                        <span className={`fix-badge ${result.fix.method === "ai" ? "fix-badge-ai" : "fix-badge-rule"}`}>
                          {result.fix.method === "ai" ? "AI" : "RULE"}
                        </span>
                        <span>
                          {result.fix.method === "ai"
                            ? "AI rewrote the file to fix errors"
                            : "Errors were automatically corrected"}
                        </span>
                      </div>
                    )}

                    {/* Fix failed */}
                    {!result.validation.valid && result.fix?.error && !result.fix?.fixed && (
                      <div className="fix-error-notice">Could not auto-fix: {result.fix.error}</div>
                    )}

                    {/* Valid, no output */}
                    {result.validation.valid && !result.validation.formatted && (
                      <div className="valid-banner">
                        <span className="valid-icon">✓</span>
                        <div>
                          <div className="valid-text">File is valid</div>
                          <div className="valid-subtext">No issues detected</div>
                        </div>
                      </div>
                    )}

                    {/* Output block */}
                    {outputContent && (
                      <div className="formatted-section">
                        <div className="formatted-header">
                          <span className="formatted-label mono">
                            {wasFixed
                              ? result.fix.method === "ai" ? "⚡ AI Fixed Output" : "⚡ Auto-Fixed Output"
                              : "✦ Formatted Output"}
                          </span>
                          <div className="btn-row">
                            <button className="download-btn" onClick={handleDownload}>↓ Download</button>
                            <button className={`copy-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
                              {copied ? "✓ Copied" : "Copy"}
                            </button>
                          </div>
                        </div>
                        <pre className="code-block">{outputContent}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <footer>
          <span className="footer-text">
            <span className="footer-accent">FileLint/</span> v0.1.0
          </span>
          <span className="footer-text">{SUPPORTED_TYPES.length} VALIDATORS ACTIVE</span>
        </footer>
      </div>
    </>
  );
}
