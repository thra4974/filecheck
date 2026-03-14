import { useState, useCallback, useRef, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

const TYPE_COLORS = {
  json: "#F0A500", yaml: "#7B61FF", python: "#3B8EEA", xml: "#FF6B35",
  html: "#E34C26", csv: "#00C49A", toml: "#9B59B6", sql: "#00B4D8",
  markdown: "#74B9FF", env: "#FD79A8",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const VALIDATOR_PAGES = {
  "json-validator": {
    type: "json", slug: "json-validator",
    title: "JSON Validator & Formatter Online — Free",
    metaDescription: "Validate and format JSON instantly. Paste your JSON to check for syntax errors, missing commas, and invalid structure. Free, private, no file storage.",
    h1: "Free JSON Validator & Formatter",
    tagline: "Instant JSON validation, error detection, and auto-formatting. No signup required.",
    intro: `JSON (JavaScript Object Notation) is the most widely used data interchange format in modern development, but even experienced developers run into syntax errors. Missing commas, trailing commas, unquoted keys, and mismatched brackets are the most common mistakes that break JSON files silently.\n\nFileLint's JSON validator checks your JSON instantly against the RFC 8259 specification. Paste your JSON below and get immediate feedback on any errors, with line numbers pointing to exactly where the problem is. If errors are found, the auto-fix feature corrects common mistakes automatically and outputs clean, properly formatted JSON.`,
    placeholder: '{\n  "name": "your-app",\n  "version": "1.0.0",\n  "active": true,\n  "tags": ["api", "config"]\n}',
    faqs: [
      { q: "What is JSON validation?", a: "JSON validation checks that your JSON file conforms to the JSON specification — correct syntax, properly quoted keys, no trailing commas, and balanced brackets. Invalid JSON will fail to parse in any programming language." },
      { q: "What are the most common JSON errors?", a: "The most common JSON errors are trailing commas after the last item in an array or object, single quotes instead of double quotes, unquoted object keys, missing commas between properties, and mismatched or missing brackets and braces." },
      { q: "Is my JSON data private?", a: "Yes. FileLint processes your file on our server and immediately discards it. We never store, log, or share your file contents. Your data is never retained after the validation response is returned." },
      { q: "Can FileLint fix broken JSON automatically?", a: "Yes. FileLint uses a two-layer auto-fix system — rule-based fixes handle common errors like trailing commas and single quotes, and an AI-powered fallback handles more complex structural issues." },
      { q: "What is the difference between JSON validation and JSON formatting?", a: "Validation checks that your JSON is syntactically correct. Formatting (also called pretty-printing) takes valid JSON and outputs it with consistent indentation and spacing to make it human-readable." },
    ],
    related: [{ slug: "yaml-validator", label: "YAML Validator" }, { slug: "csv-validator", label: "CSV Validator" }, { slug: "toml-validator", label: "TOML Validator" }],
  },
  "json-formatter": {
    type: "json", slug: "json-formatter",
    title: "JSON Formatter Online — Beautify & Minify JSON Free",
    metaDescription: "Format, beautify, and minify JSON online for free. Paste your JSON to get clean, properly indented output instantly. No signup required.",
    h1: "Free JSON Formatter & Beautifier",
    tagline: "Paste minified or ugly JSON and get clean, readable output instantly.",
    intro: `Minified JSON is efficient for APIs and data transfer but nearly impossible for humans to read. A single line of JSON with hundreds of nested properties makes debugging and editing extremely difficult.\n\nFileLint's JSON formatter takes any valid JSON — minified, inconsistently indented, or poorly structured — and outputs clean, properly formatted JSON with consistent 2-space indentation. It also validates your JSON first, so if there are syntax errors they are caught and fixed before formatting.`,
    placeholder: '{"name":"your-app","version":"1.0.0","dependencies":{"react":"18.0.0","vite":"5.0.0"}}',
    faqs: [
      { q: "What is JSON formatting?", a: "JSON formatting (also called beautifying or pretty-printing) takes compact or inconsistently spaced JSON and outputs it with clean, consistent indentation that makes it easy to read and understand the structure." },
      { q: "What indentation style does FileLint use?", a: "FileLint formats JSON with 2-space indentation, which is the most widely accepted standard in the JavaScript and web development community." },
      { q: "Can I format JSON that has errors?", a: "Yes. FileLint validates and auto-fixes common JSON errors before formatting, so even slightly broken JSON can be cleaned up and formatted in one step." },
      { q: "Is there a file size limit?", a: "FileLint handles files up to several megabytes for the free tier. Very large JSON files may take a moment to process." },
    ],
    related: [{ slug: "json-validator", label: "JSON Validator" }, { slug: "yaml-validator", label: "YAML Validator" }, { slug: "csv-validator", label: "CSV Validator" }],
  },
  "yaml-validator": {
    type: "yaml", slug: "yaml-validator",
    title: "YAML Validator Online — Free YAML Lint & Checker",
    metaDescription: "Validate YAML files online for free. Check for indentation errors, syntax issues, and invalid structure instantly. Used for Kubernetes, Docker, GitHub Actions configs.",
    h1: "Free YAML Validator & Linter",
    tagline: "Validate YAML instantly. Catch indentation errors before they break your deployments.",
    intro: `YAML is the configuration language behind Kubernetes, Docker Compose, GitHub Actions, Ansible, and countless other DevOps tools. It is also one of the most error-prone formats to write by hand — YAML is whitespace-sensitive, meaning a single wrong indentation level can cause a deployment to fail silently or produce unexpected behavior.\n\nFileLint's YAML validator checks your YAML against the YAML 1.2 specification and highlights indentation errors, invalid characters, incorrect mapping syntax, and structural problems. Paste your Kubernetes manifest, GitHub Actions workflow, or any YAML config below and catch errors before they cause production issues.`,
    placeholder: 'name: my-service\nversion: 1.0.0\nconfig:\n  host: localhost\n  port: 8080\n  debug: false',
    faqs: [
      { q: "What are the most common YAML errors?", a: "The most common YAML errors are inconsistent indentation (mixing tabs and spaces), incorrect mapping syntax, duplicate keys, improper use of special characters, and invalid scalar values. YAML requires spaces for indentation — tabs are not allowed." },
      { q: "Can I validate Kubernetes YAML with FileLint?", a: "Yes. FileLint validates the YAML syntax of any Kubernetes manifest. For schema-level validation (checking that your fields match the Kubernetes API spec), you would additionally need a tool like kubeval." },
      { q: "Can I validate GitHub Actions workflows?", a: "Yes. GitHub Actions workflow files are standard YAML and FileLint will catch syntax errors before you push them to your repository." },
      { q: "What is the difference between YAML and JSON?", a: "YAML and JSON are both data serialization formats. YAML is designed to be more human-readable and supports comments, while JSON is simpler and more widely supported by parsers. YAML is a superset of JSON, meaning valid JSON is also valid YAML." },
      { q: "Can FileLint fix YAML indentation errors?", a: "Yes. FileLint's auto-fix feature corrects common YAML indentation errors and outputs clean, properly structured YAML." },
    ],
    related: [{ slug: "json-validator", label: "JSON Validator" }, { slug: "toml-validator", label: "TOML Validator" }, { slug: "env-validator", label: "ENV Validator" }],
  },
  "csv-validator": {
    type: "csv", slug: "csv-validator",
    title: "CSV Validator Online — Free CSV File Checker",
    metaDescription: "Validate CSV files online for free. Check for inconsistent columns, missing headers, and formatting errors instantly. Private — files are never stored.",
    h1: "Free CSV Validator & Checker",
    tagline: "Check CSV files for inconsistent columns, missing headers, and structural errors.",
    intro: `CSV (Comma-Separated Values) files are the most universal data exchange format — used in spreadsheets, databases, data pipelines, and API exports. But malformed CSV files cause silent failures in imports, broken database loads, and corrupted data analysis.\n\nFileLint's CSV validator checks your CSV file for inconsistent column counts across rows, missing or malformed headers, improper quoting of values that contain commas, and encoding issues. Whether you're validating a data export before importing to a database or checking a spreadsheet before sharing, FileLint catches problems instantly.`,
    placeholder: 'name,age,email,city\nAlice,30,alice@example.com,New York\nBob,25,bob@example.com,Los Angeles\nCarol,35,carol@example.com,Chicago',
    faqs: [
      { q: "What does CSV validation check?", a: "CSV validation checks that every row has the same number of columns as the header row, that values containing commas are properly quoted, that the file has a consistent delimiter, and that the structure is parseable by standard CSV parsers." },
      { q: "Why does my CSV fail to import even though it looks correct?", a: "Common hidden issues include values containing commas that are not quoted, newline characters inside quoted fields, inconsistent line endings (Windows CRLF vs Unix LF), and byte-order marks (BOM) at the start of the file." },
      { q: "Can I convert CSV to JSON?", a: "Yes. FileLint includes a file conversion feature. After validating your CSV, select JSON as the target format to get a JSON array of objects representing your CSV data." },
      { q: "Is my CSV data private?", a: "Yes. FileLint processes your file immediately and discards it. We never store, log, or share your file contents." },
    ],
    related: [{ slug: "json-validator", label: "JSON Validator" }, { slug: "json-formatter", label: "JSON Formatter" }, { slug: "yaml-validator", label: "YAML Validator" }],
  },
  "xml-validator": {
    type: "xml", slug: "xml-validator",
    title: "XML Validator Online — Free XML Syntax Checker",
    metaDescription: "Validate XML files online for free. Check for unclosed tags, malformed attributes, and syntax errors instantly. Works with any XML format.",
    h1: "Free XML Validator & Syntax Checker",
    tagline: "Validate XML syntax instantly. Catch unclosed tags and malformed attributes before they cause parsing failures.",
    intro: `XML (Extensible Markup Language) powers countless data exchange formats including SOAP APIs, RSS feeds, SVG graphics, Maven build files, Android layouts, and Office documents. Despite being a mature format, XML is strict about syntax — a single unclosed tag or malformed attribute will cause the entire document to fail parsing.\n\nFileLint's XML validator checks your XML for well-formedness — ensuring all tags are properly closed, attributes are correctly quoted, special characters are properly escaped, and the document structure is valid.`,
    placeholder: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <item id="1">\n    <name>Example</name>\n    <value>42</value>\n  </item>\n</root>',
    faqs: [
      { q: "What is XML validation?", a: "XML validation checks that a document is well-formed — meaning all tags are properly opened and closed, attributes are quoted, and the document follows XML syntax rules. Schema validation (checking against a DTD or XSD) is a separate, more advanced check." },
      { q: "What are the most common XML errors?", a: "Common XML errors include unclosed tags, mismatched tag names, unquoted attributes, bare ampersands and angle brackets that should be escaped as &amp; and &lt;, and multiple root elements." },
      { q: "Can I validate SVG files?", a: "Yes. SVG files are XML documents and FileLint's XML validator will check them for syntax errors." },
    ],
    related: [{ slug: "json-validator", label: "JSON Validator" }, { slug: "yaml-validator", label: "YAML Validator" }, { slug: "html-validator", label: "HTML Validator" }],
  },
  "html-validator": {
    type: "html", slug: "html-validator",
    title: "HTML Validator Online — Free HTML Syntax Checker",
    metaDescription: "Validate HTML online for free. Check for unclosed tags, missing attributes, and structural errors instantly. Private — files are never stored.",
    h1: "Free HTML Validator & Syntax Checker",
    tagline: "Catch unclosed tags, missing attributes, and structural HTML errors instantly.",
    intro: `Valid HTML is the foundation of accessible, cross-browser compatible web pages. While modern browsers are forgiving of HTML errors, invalid HTML can cause unexpected rendering issues, break accessibility tools, and interfere with search engine crawling.\n\nFileLint's HTML validator checks your HTML for common structural errors including unclosed tags, missing required attributes, improperly nested elements, and malformed doctype declarations.`,
    placeholder: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8">\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Hello World</h1>\n    <p>Welcome to my page.</p>\n  </body>\n</html>',
    faqs: [
      { q: "Why does HTML validation matter?", a: "Valid HTML ensures your pages render consistently across browsers, are accessible to screen readers, and are correctly indexed by search engines. Invalid HTML can cause subtle layout bugs that are difficult to diagnose." },
      { q: "My page renders fine in Chrome — why is it invalid?", a: "Browsers are intentionally forgiving of HTML errors to maintain compatibility with older web content. However, that forgiveness varies between browsers — what works in Chrome may not work in Safari or Firefox." },
      { q: "Can I validate HTML email templates?", a: "Yes. FileLint checks the HTML structure of any HTML document including email templates." },
    ],
    related: [{ slug: "xml-validator", label: "XML Validator" }, { slug: "json-validator", label: "JSON Validator" }, { slug: "markdown-validator", label: "Markdown Validator" }],
  },
  "sql-formatter": {
    type: "sql", slug: "sql-formatter",
    title: "SQL Formatter & Validator Online — Free",
    metaDescription: "Format and validate SQL queries online for free. Beautify messy SQL instantly with proper indentation and keyword casing. Works with SELECT, INSERT, UPDATE and more.",
    h1: "Free SQL Formatter & Validator",
    tagline: "Format messy SQL into clean, readable queries instantly.",
    intro: `SQL written under time pressure or generated by ORMs is often a single unreadable line of keywords, table names, and conditions. Reading and debugging minified SQL is unnecessarily difficult when proper formatting makes the structure immediately obvious.\n\nFileLint's SQL formatter takes any SQL query — SELECT, INSERT, UPDATE, DELETE, CREATE, or stored procedures — and outputs clean, properly indented SQL with consistent keyword casing. It also validates your SQL syntax and catches common errors before they reach your database.`,
    placeholder: 'SELECT u.id, u.name, u.email, COUNT(o.id) as order_count\nFROM users u\nLEFT JOIN orders o ON u.id = o.user_id\nWHERE u.active = true\nGROUP BY u.id\nORDER BY order_count DESC\nLIMIT 100;',
    faqs: [
      { q: "What SQL dialects does FileLint support?", a: "FileLint validates and formats standard SQL (ANSI SQL). Most queries written for PostgreSQL, MySQL, SQLite, and SQL Server are compatible." },
      { q: "Does FileLint execute my SQL?", a: "No. FileLint only parses and formats your SQL — it never connects to a database or executes any queries. Your SQL is processed entirely for syntax analysis." },
      { q: "Can I validate SQL before running it in production?", a: "Yes. FileLint catches common syntax errors before you run queries, which is particularly useful for catching mistakes in destructive operations like DELETE or UPDATE." },
    ],
    related: [{ slug: "json-validator", label: "JSON Validator" }, { slug: "yaml-validator", label: "YAML Validator" }, { slug: "python-syntax-checker", label: "Python Syntax Checker" }],
  },
  "python-syntax-checker": {
    type: "python", slug: "python-syntax-checker",
    title: "Python Syntax Checker Online — Free",
    metaDescription: "Check Python syntax online for free. Validate Python code for syntax errors, indentation issues, and common mistakes instantly without running it.",
    h1: "Free Python Syntax Checker",
    tagline: "Catch Python syntax errors and indentation issues without running your code.",
    intro: `Python's clean syntax makes it one of the most readable programming languages, but syntax errors and indentation mistakes still happen — especially when editing code in environments without a linter, copying from documentation, or writing quick scripts.\n\nFileLint's Python syntax checker validates your Python code using pyflakes and Python's built-in AST parser to catch syntax errors, undefined variables, unused imports, and indentation issues before you run your code.`,
    placeholder: 'def calculate_total(items):\n    total = 0\n    for item in items:\n        total += item["price"] * item["quantity"]\n    return total\n\norders = [\n    {"price": 29.99, "quantity": 2},\n    {"price": 9.99, "quantity": 5},\n]\n\nprint(f"Total: ${calculate_total(orders):.2f}")',
    faqs: [
      { q: "What does the Python syntax checker detect?", a: "FileLint catches syntax errors, indentation errors (mixed tabs and spaces), undefined variable names, unused imports, and other common static analysis issues." },
      { q: "Does FileLint execute my Python code?", a: "No. FileLint performs static analysis only — it parses your code without executing it. This means it is safe to check any Python code regardless of what it does." },
      { q: "Which Python version does FileLint use?", a: "FileLint uses Python 3.11 for syntax checking, which covers all modern Python 3 syntax including walrus operators, match statements, and type hints." },
    ],
    related: [{ slug: "json-validator", label: "JSON Validator" }, { slug: "yaml-validator", label: "YAML Validator" }, { slug: "sql-formatter", label: "SQL Formatter" }],
  },
  "toml-validator": {
    type: "toml", slug: "toml-validator",
    title: "TOML Validator Online — Free TOML Syntax Checker",
    metaDescription: "Validate TOML files online for free. Check Cargo.toml, pyproject.toml, and any TOML config for syntax errors instantly.",
    h1: "Free TOML Validator & Syntax Checker",
    tagline: "Validate Cargo.toml, pyproject.toml, and any TOML config instantly.",
    intro: `TOML (Tom's Obvious Minimal Language) is the configuration format of choice for Rust projects (Cargo.toml), Python packaging (pyproject.toml), and many modern tools. Its syntax is designed to be obvious and readable, but incorrect value types, invalid datetime formats, and duplicate keys can cause tools to fail silently.\n\nFileLint's TOML validator checks your TOML file against the TOML v1.0 specification and catches syntax errors, duplicate keys, invalid value types, and malformed inline tables or arrays before they cause issues in your build pipeline.`,
    placeholder: '[package]\nname = "my-project"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nserde = { version = "1.0", features = ["derive"] }\n\n[profile.release]\nopt-level = 3',
    faqs: [
      { q: "What is TOML used for?", a: "TOML is used for configuration files in many modern tools. The most common uses are Cargo.toml for Rust packages, pyproject.toml for Python projects, config.toml for Hugo static sites, and various other build and configuration tools." },
      { q: "What are common TOML errors?", a: "Common TOML errors include duplicate keys in the same table, incorrect value types, malformed dates, improperly formatted inline tables, and missing quotes around string values." },
      { q: "Can I convert TOML to JSON or YAML?", a: "Yes. FileLint includes conversion support. After validating your TOML, you can convert it to JSON or YAML using the Convert File feature in the results panel." },
    ],
    related: [{ slug: "yaml-validator", label: "YAML Validator" }, { slug: "json-validator", label: "JSON Validator" }, { slug: "env-validator", label: "ENV Validator" }],
  },
  "env-validator": {
    type: "env", slug: "env-validator",
    title: "ENV File Validator Online — Free .env Checker",
    metaDescription: "Validate .env files online for free. Check for syntax errors, invalid key names, and accidentally committed secrets. Private — files are never stored.",
    h1: "Free ENV File Validator & Secret Scanner",
    tagline: "Validate .env files and scan for accidentally exposed secrets before committing.",
    intro: `.env files store environment variables for applications — API keys, database connection strings, feature flags, and service credentials. They are also one of the most common sources of accidental secret exposure when developers forget to add them to .gitignore and commit them to public repositories.\n\nFileLint's ENV file validator checks your .env file for syntax errors, invalid key naming, missing values, and improperly quoted strings. It also runs a secrets scanner that flags potential API keys, tokens, and credentials that may have been accidentally included.`,
    placeholder: 'APP_NAME=MyApp\nAPP_ENV=production\nAPP_PORT=3000\n\nDB_HOST=localhost\nDB_PORT=5432\nDB_NAME=myapp_db\n\nAPI_KEY=your_api_key_here\nDEBUG=false',
    faqs: [
      { q: "What does ENV file validation check?", a: "FileLint checks that each line follows the KEY=VALUE format, that key names use only valid characters (letters, numbers, underscores), that values are properly quoted when they contain spaces or special characters, and that there are no syntax errors." },
      { q: "Does FileLint scan for exposed secrets?", a: "Yes. FileLint automatically scans every file for potential secrets including AWS keys, API tokens, GitHub tokens, database connection strings, and private keys. Any findings are flagged with the line number and severity level." },
      { q: "Is it safe to paste my real .env file?", a: "FileLint processes your file on our server and immediately discards it. That said, we recommend using a copy with placeholder values for sensitive production credentials, as a best practice." },
      { q: "What is the difference between .env and .env.example?", a: ".env contains your actual secret values and should never be committed to version control. .env.example is a template with placeholder values that shows other developers what variables are needed — it is safe to commit." },
    ],
    related: [{ slug: "yaml-validator", label: "YAML Validator" }, { slug: "toml-validator", label: "TOML Validator" }, { slug: "json-validator", label: "JSON Validator" }],
  },
  "markdown-validator": {
    type: "markdown", slug: "markdown-validator",
    title: "Markdown Validator Online — Free Markdown Checker",
    metaDescription: "Validate and preview Markdown online for free. Check for syntax issues and formatting errors in README files, documentation, and blog posts.",
    h1: "Free Markdown Validator & Checker",
    tagline: "Validate Markdown syntax for README files, documentation, and blog posts.",
    intro: `Markdown is the universal format for README files, documentation, blog posts, and developer notes. While Markdown is designed to be forgiving, inconsistent syntax can produce unexpected rendering in GitHub, GitLab, or documentation platforms.\n\nFileLint's Markdown validator checks your Markdown for common structural issues including unclosed code blocks, improperly formatted links and images, inconsistent heading hierarchy, and other syntax patterns that may render incorrectly across different Markdown parsers.`,
    placeholder: '# Project Name\n\nA brief description of what this project does.\n\n## Installation\n\n```bash\nnpm install my-package\n```\n\n## Usage\n\n```javascript\nconst pkg = require("my-package");\npkg.doSomething();\n```\n\n## License\n\nMIT',
    faqs: [
      { q: "Which Markdown specification does FileLint use?", a: "FileLint validates against CommonMark, the most widely adopted Markdown specification, which is used by GitHub, GitLab, and most documentation platforms." },
      { q: "Can I validate GitHub README files?", a: "Yes. GitHub uses a variant of CommonMark for README files. FileLint's Markdown validator will catch issues that would affect rendering on GitHub." },
      { q: "Does FileLint check for broken links?", a: "FileLint checks Markdown link syntax (proper formatting of links and images) but does not make network requests to verify that URLs resolve." },
    ],
    related: [{ slug: "html-validator", label: "HTML Validator" }, { slug: "yaml-validator", label: "YAML Validator" }, { slug: "json-validator", label: "JSON Validator" }],
  },
};

const toolStyles = `
  .vp-textarea {
    width: 100%; min-height: 280px; background: #0A0A0A; border: 1px solid #222;
    border-radius: 4px; color: #B8D4A0; font-family: 'Syne Mono', monospace;
    font-size: 12px; line-height: 1.7; padding: 20px; resize: vertical; outline: none;
    transition: border-color 0.2s; white-space: pre; overflow-wrap: normal; overflow-x: auto; box-sizing: border-box;
  }
  .vp-textarea:focus { border-color: #C8FF0040; }
  .vp-textarea::placeholder { color: #444; }
  .vp-textarea::-webkit-scrollbar { width: 4px; height: 4px; }
  .vp-textarea::-webkit-scrollbar-track { background: transparent; }
  .vp-textarea::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
  .vp-btn-primary {
    background: #C8FF00; color: #000; border: none; font-family: 'Syne Mono', monospace;
    font-size: 12px; font-weight: 700; letter-spacing: 1px; padding: 10px 28px;
    border-radius: 3px; cursor: pointer; transition: all 0.15s; text-transform: uppercase;
  }
  .vp-btn-primary:hover { background: #AADD00; transform: translateY(-1px); }
  .vp-btn-primary:disabled { background: #333; color: #666; cursor: not-allowed; transform: none; }
  .vp-btn-secondary {
    background: transparent; border: 1px solid #333; color: #666; font-family: 'Syne Mono', monospace;
    font-size: 11px; padding: 10px 16px; border-radius: 3px; cursor: pointer;
    transition: all 0.15s; letter-spacing: 1px; text-transform: uppercase;
  }
  .vp-btn-secondary:hover { border-color: #FF4545; color: #FF4545; }
  .vp-code-block {
    padding: 20px; font-family: 'Syne Mono', monospace; font-size: 12px; line-height: 1.7;
    color: #B8D4A0; overflow-x: auto; white-space: pre; max-height: 320px; overflow-y: auto; background: #0A0A0A;
  }
  .vp-code-block::-webkit-scrollbar { width: 4px; height: 4px; }
  .vp-code-block::-webkit-scrollbar-track { background: transparent; }
  .vp-code-block::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
  .vp-result-card { background: #141414; border: 1px solid #222; border-radius: 4px; overflow: hidden; margin-top: 16px; }
  .vp-result-header { padding: 14px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #222; font-family: 'Syne Mono', monospace; }
  .vp-spinner { font-family: 'Syne Mono', monospace; font-size: 24px; color: #C8FF00; animation: spin 0.8s linear infinite; display: inline-block; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

function EmbeddedTool({ config }) {
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef(null);
  const typeColor = TYPE_COLORS[config.type] || "#888";

  const validate = useCallback(async (text) => {
    if (!text.trim()) { setResult(null); return; }
    setIsLoading(true); setError(null);
    try {
      const res = await fetch(`${API_URL}/validate-text`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, file_type: config.type }),
      });
      if (!res.ok) throw new Error("Validation failed");
      setResult(await res.json());
    } catch (err) { setError(err.message); }
    finally { setIsLoading(false); }
  }, [config.type]);

  useEffect(() => {
    if (!content.trim()) { setResult(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => validate(content), 800);
    return () => clearTimeout(debounceRef.current);
  }, [content, validate]);

  const outputContent = result?.fix?.fixed && !result?.validation?.valid
    ? result.fix.fixed : result?.validation?.formatted || null;

  const handleCopy = () => {
    if (outputContent) { navigator.clipboard.writeText(outputContent); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const handleDownload = () => {
    if (!outputContent) return;
    const blob = new Blob([outputContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `validated.${config.type}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Syne Mono', monospace", fontSize: 11, padding: "3px 10px", borderRadius: 2, border: `1px solid ${typeColor}50`, background: typeColor + "12", color: typeColor, letterSpacing: 1 }}>
          {config.type.toUpperCase()}
        </span>
        <span style={{ fontSize: 11, color: "#444", fontFamily: "'Syne Mono', monospace", letterSpacing: 1 }}>AUTO-VALIDATES AS YOU TYPE</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="vp-btn-secondary" onClick={() => { setContent(""); setResult(null); }}>CLEAR</button>
          <button className="vp-btn-primary" onClick={() => validate(content)} disabled={!content.trim() || isLoading}>VALIDATE</button>
        </div>
      </div>

      <textarea className="vp-textarea" value={content} onChange={(e) => setContent(e.target.value)} placeholder={config.placeholder} spellCheck={false} />

      {isLoading && (
        <div style={{ textAlign: "center", padding: "24px", color: "#666", fontFamily: "'Syne Mono', monospace", fontSize: 12 }}>
          <span className="vp-spinner">◌</span>
          <div style={{ marginTop: 8, letterSpacing: 2 }}>VALIDATING...</div>
        </div>
      )}

      {error && !isLoading && (
        <div className="vp-result-card" style={{ borderColor: "#FF454540" }}>
          <div className="vp-result-header" style={{ background: "#3D1212" }}>
            <span style={{ color: "#FF4545", fontSize: 16 }}>✕</span>
            <span style={{ color: "#FF4545", fontSize: 13, fontWeight: 600 }}>API Error</span>
          </div>
          <div style={{ padding: "14px 20px", fontSize: 13, color: "#FF9090", fontFamily: "'Syne Mono', monospace" }}>{error}</div>
        </div>
      )}

      {result && !isLoading && (
        <>
          <div className="vp-result-card" style={{ borderColor: result.validation.valid ? "#C8FF0030" : "#FF454530" }}>
            <div className="vp-result-header" style={{ background: result.validation.valid ? "#1A2200" : "#3D1212", borderColor: result.validation.valid ? "#C8FF0030" : "#FF454530" }}>
              <span style={{ color: result.validation.valid ? "#C8FF00" : "#FF4545", fontSize: 18 }}>{result.validation.valid ? "✓" : "✕"}</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: result.validation.valid ? "#C8FF00" : "#FF4545" }}>{result.validation.valid ? "Valid" : "Validation Failed"}</span>
              {result.validation.errors.length > 0 && <span style={{ fontSize: 11, color: "#FF4545", letterSpacing: 1 }}>{result.validation.errors.length} ERROR{result.validation.errors.length !== 1 ? "S" : ""}</span>}
            </div>
            {result.validation.errors.length > 0 && (
              <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                {result.validation.errors.map((err, i) => (
                  <div key={i} style={{ background: "#3D1212", border: "1px solid #FF454530", borderRadius: 3, padding: "8px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: "#FF4545", fontFamily: "'Syne Mono', monospace", fontSize: 12 }}>→</span>
                    <span style={{ fontSize: 12, color: "#FF9090", fontFamily: "'Syne Mono', monospace", lineHeight: 1.5 }}>{err}</span>
                  </div>
                ))}
              </div>
            )}
            {result.validation.valid && !result.validation.formatted && (
              <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 12, background: "#1A2200" }}>
                <span style={{ fontSize: 20, color: "#C8FF00" }}>✓</span>
                <div>
                  <div style={{ fontSize: 13, color: "#A8D060", fontWeight: 500 }}>File is valid</div>
                  <div style={{ fontSize: 12, color: "#5A7A30", marginTop: 2 }}>No issues detected</div>
                </div>
              </div>
            )}
          </div>

          {outputContent && (
            <div className="vp-result-card" style={{ marginTop: 12 }}>
              <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222" }}>
                <span style={{ fontSize: 11, letterSpacing: 2, color: "#666", fontFamily: "'Syne Mono', monospace", textTransform: "uppercase" }}>
                  {result.fix?.fixed && !result.validation?.valid ? "⚡ Auto-Fixed Output" : "✦ Formatted Output"}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="vp-btn-secondary" onClick={handleDownload}>↓ Download</button>
                  <button className="vp-btn-secondary" style={copied ? { borderColor: "#C8FF00", color: "#C8FF00" } : {}} onClick={handleCopy}>{copied ? "✓ Copied" : "Copy"}</button>
                </div>
              </div>
              <pre className="vp-code-block">{outputContent}</pre>
            </div>
          )}

          {result.scan && !result.scan.clean && (
            <div className="vp-result-card" style={{ marginTop: 12, borderColor: "#FF8C4240" }}>
              <div className="vp-result-header" style={{ background: "#1A0800", borderColor: "#FF8C4230" }}>
                <span style={{ fontSize: 16 }}>⚠</span>
                <span style={{ color: "#FF8C42", fontSize: 13, fontWeight: 600, flex: 1 }}>Secrets Detected</span>
                <span style={{ fontSize: 11, color: "#FF8C42", letterSpacing: 1 }}>{result.scan.findings.length} WARNING{result.scan.findings.length !== 1 ? "S" : ""}</span>
              </div>
              <div style={{ padding: "12px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
                {result.scan.findings.map((f, i) => (
                  <div key={i} style={{ background: "#1A0800", border: "1px solid #FF8C4230", borderRadius: 3, padding: "8px 14px", fontSize: 12, color: "#FF8C42", fontFamily: "'Syne Mono', monospace" }}>
                    → Line {f.line}: {f.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ValidatorPage({ slug }) {
  const config = VALIDATOR_PAGES[slug];
  if (!config) {
    return (
      <div style={{ minHeight: "100vh", background: "#0C0C0C", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#666" }}>
          <div style={{ fontFamily: "'Syne Mono', monospace", fontSize: 48, marginBottom: 16 }}>404</div>
          <Link to="/" style={{ color: "#C8FF00", textDecoration: "none", fontFamily: "'Syne Mono', monospace", fontSize: 12, letterSpacing: 2 }}>← BACK TO FILELINT</Link>
        </div>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[config.type] || "#888";

  return (
    <>
      <Helmet>
        <title>{config.title}</title>
        <meta name="description" content={config.metaDescription} />
        <link rel="canonical" href={`https://filelint.com/${config.slug}`} />
        <meta property="og:title" content={config.title} />
        <meta property="og:description" content={config.metaDescription} />
        <meta property="og:url" content={`https://filelint.com/${config.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org", "@type": "WebApplication",
          "name": config.h1, "url": `https://filelint.com/${config.slug}`,
          "description": config.metaDescription, "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Any", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
        })}</script>
      </Helmet>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne+Mono&family=Outfit:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0C0C0C; color: #E8E8E8; font-family: 'Outfit', sans-serif; }
        ${toolStyles}
        .vp-grid { position: fixed; inset: 0; background-image: linear-gradient(#222 1px, transparent 1px), linear-gradient(90deg, #222 1px, transparent 1px); background-size: 48px 48px; opacity: 0.3; pointer-events: none; z-index: 0; }
        .vp-wrap { position: relative; z-index: 1; max-width: 860px; margin: 0 auto; padding: 0 32px 80px; }
        .vp-nav { padding: 28px 0 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1A1A1A; margin-bottom: 48px; }
        .vp-logo { font-family: 'Syne Mono', monospace; font-size: 18px; color: #C8FF00; text-decoration: none; letter-spacing: -1px; }
        .vp-logo span { color: #444; }
        .vp-all-tools { font-family: 'Syne Mono', monospace; font-size: 11px; letter-spacing: 2px; color: #444; text-decoration: none; text-transform: uppercase; transition: color 0.15s; }
        .vp-all-tools:hover { color: #C8FF00; }
        .vp-type-tag { display: inline-flex; align-items: center; gap: 6px; font-family: 'Syne Mono', monospace; font-size: 10px; letter-spacing: 2px; padding: 4px 12px; border-radius: 2px; border: 1px solid; text-transform: uppercase; margin-bottom: 20px; }
        .vp-h1 { font-size: clamp(26px, 4vw, 40px); font-weight: 600; line-height: 1.15; margin-bottom: 12px; color: #F0F0F0; }
        .vp-tagline { font-size: 16px; color: #666; line-height: 1.6; margin-bottom: 24px; }
        .vp-intro { font-size: 14px; color: #555; line-height: 1.8; }
        .vp-intro p { margin-bottom: 16px; }
        .vp-tool-section { background: #141414; border: 1px solid #222; border-radius: 4px; padding: 24px; margin: 40px 0; }
        .vp-tool-heading { font-family: 'Syne Mono', monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #444; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
        .vp-tool-heading::after { content: ''; flex: 1; height: 1px; background: #1A1A1A; }
        .vp-faq { margin: 48px 0; }
        .vp-faq-title { font-size: 22px; font-weight: 600; margin-bottom: 24px; color: #E8E8E8; }
        .vp-faq-item { border-bottom: 1px solid #1A1A1A; padding: 20px 0; }
        .vp-faq-item:last-child { border-bottom: none; }
        .vp-faq-q { font-size: 15px; font-weight: 600; color: #C8C8C8; margin-bottom: 10px; }
        .vp-faq-a { font-size: 14px; color: #555; line-height: 1.7; }
        .vp-related { margin-top: 48px; padding-top: 32px; border-top: 1px solid #1A1A1A; }
        .vp-related-title { font-family: 'Syne Mono', monospace; font-size: 11px; letter-spacing: 3px; text-transform: uppercase; color: #444; margin-bottom: 16px; }
        .vp-related-links { display: flex; flex-wrap: wrap; gap: 8px; }
        .vp-related-link { font-family: 'Syne Mono', monospace; font-size: 11px; letter-spacing: 1px; padding: 6px 14px; border: 1px solid #222; border-radius: 2px; color: #555; text-decoration: none; text-transform: uppercase; transition: all 0.15s; }
        .vp-related-link:hover { border-color: #C8FF00; color: #C8FF00; }
        .vp-footer { text-align: center; padding-top: 48px; border-top: 1px solid #1A1A1A; font-family: 'Syne Mono', monospace; font-size: 11px; color: #333; letter-spacing: 1px; }
        .vp-footer a { color: #C8FF00; text-decoration: none; }
        @media (max-width: 600px) { .vp-wrap { padding: 0 20px 60px; } }
      `}</style>

      <div className="vp-grid" />
      <div className="vp-wrap">
        <nav className="vp-nav">
          <Link to="/" className="vp-logo">FileLint<span>/</span></Link>
          <Link to="/" className="vp-all-tools">← All Tools</Link>
        </nav>

        <div>
          <div className="vp-type-tag" style={{ color: typeColor, borderColor: typeColor + "40", background: typeColor + "10" }}>
            <span>●</span>{config.type.toUpperCase()} VALIDATOR
          </div>
          <h1 className="vp-h1">{config.h1}</h1>
          <p className="vp-tagline">{config.tagline}</p>
          <div className="vp-intro">
            {config.intro.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </div>

        <div className="vp-tool-section">
          <div className="vp-tool-heading">Try It Now — Free</div>
          <EmbeddedTool config={config} />
        </div>

        <section className="vp-faq">
          <h2 className="vp-faq-title">Frequently Asked Questions</h2>
          {config.faqs.map((faq, i) => (
            <div key={i} className="vp-faq-item">
              <div className="vp-faq-q">{faq.q}</div>
              <div className="vp-faq-a">{faq.a}</div>
            </div>
          ))}
        </section>

        <div className="vp-related">
          <div className="vp-related-title">Related Validators</div>
          <div className="vp-related-links">
            {config.related.map((rel) => (
              <Link key={rel.slug} to={`/${rel.slug}`} className="vp-related-link">{rel.label}</Link>
            ))}
            <Link to="/" className="vp-related-link">All Validators →</Link>
          </div>
        </div>

        <div className="vp-footer">
          <p><a href="/">FileLint</a> — Free file validation, auto-fix, and secrets scanning. Files are never stored.</p>
        </div>
      </div>
    </>
  );
}
