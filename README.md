# Themis AI: Cognitive OS Harness (MCP Server)

Themis is an AI Agent designed to facilitate **Vibe Coding** while maintaining rigorous documentation and architectural integrity. It acts as a **Cognitive OS Harness**, allowing developers to build rapidly with AI while automatically extracting precise specifications and managing a structured knowledge base using the **PARA** methodology.

## 🎯 Purpose & Vision

The core mission of Themis is to bridge the gap between "Fast-paced AI development" and "Sustainable engineering standards." 

- **Developers** can focus on the creative flow (Vibe Coding) without worrying about documentation drift.
- **Themis** monitors the implementation and "reverse-engineers" the technical specifications back into the documentation system.
- **Tokens** are optimized by selectively serving only the necessary context, enabling infinite development cycles without context bloat.

## 🛠 Features

- **Context Optimization**: Serves only relevant project `README`s, `DEVELOPMENT_PLAN`s, and `Policy` files.
- **Reverse Spec Extraction**: Automatically generates `SPEC.md` from your source code (TypeScript/JS/etc.) to keep docs in sync.
- **PARA Lifecycle Management**: Automates the PARA (Projects, Areas, Resources, Archives) workflow.
- **MCP Native**: Built on the Model Context Protocol for immediate compatibility with modern AI agents.

## 🚀 Installation & Setup

### 1. Clone and Build
```bash
git clone git@github.com:esketch-ai/Themis-AI.git
cd Themis-AI
npm install
npm run build
```

### 2. Connect to your AI Agent (MCP)
Add Themis to your MCP client configuration (e.g., Gemini CLI, Cursor, or Claude Desktop):

```json
{
  "mcpServers": {
    "themis": {
      "command": "node",
      "args": ["/absolute/path/to/Themis-AI/build/index.js"]
    }
  }
}
```

## 📊 Expected Results (The "Outcome")

By using Themis as your Cognitive OS Harness, you achieve:

1. **Zero Documentation Lag**: As you vibe code, Themis extracts the structural spec. Your `SPEC.md` is always a true reflection of your code.
2. **Infinite Continuity**: New AI sessions start with perfectly distilled context, avoiding the "amnesia" common in long-running AI projects.
3. **Automated Order**: Your `docs/` folder stays clean. Completed projects are archived, and new standards are promoted to your "Areas" automatically.
4. **Token Efficiency**: Dramatic reduction in prompt overhead by excluding irrelevant files from the AI's context window.

## 🧰 Tools & Resources

- `get_optimized_context`: Distills the current project state for the AI.
- `extract_spec_from_code`: Reverses implementation back to specs.
- `archive_project`: Finalizes project lifecycle.
- **PARA Resources**: Direct access to your knowledge base via `themis://docs/...` URIs.

## 📂 PARA Directory Structure
- `docs/_para/10_projects`: Your active workspace.
- `docs/_para/20_areas`: Your engineering standards.
- `docs/_para/30_resources`: Your source knowledge.
- `docs/_para/40_archive`: Your immutable project history.

## 👤 Author

- **Name**: Seung Heon Song
- **Email**: [esketch@gmail.com](mailto:esketch@gmail.com)
- **Location**: Seoul, South Korea

## License
ISC
