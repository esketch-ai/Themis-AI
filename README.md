# 🏛️ Themis AI: Cognitive OS Harness

[English](#english) | [한국어](#한국어)

---

<a name="english"></a>
## 🌍 English

**Themis AI** is an AI Agent Harness designed to maintain **architectural integrity** and **documentation** while enabling developers to enjoy **Vibe Coding** (fast-paced AI-assisted development).

Built on the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/), it adds "memory" and "order" to your AI agents like Cursor, Claude Desktop, and VS Code.

### 🚀 Quick Start (1-Minute Setup)

#### 1. Initialize Project
Run the following command in your project terminal to automatically create the PARA (Projects, Areas, Resources, Archives) structure.
```bash
npx themis-ai init
```

#### 2. Connect to AI Agent (MCP)
Add Themis to your MCP settings (Cursor, Claude Desktop, etc.):
- **Type**: `command`
- **Command**: `npx`
- **Args**: `-y`, `themis-ai`

### 🛠️ Key Features
- **Context Optimization**: Extracts only essential context to save tokens and improve AI clarity.
- **Background GC**: Automatically archives completed projects to keep your workspace lean.
- **Security Wall**: Automatically protects sensitive files like `.env` and API keys from being leaked.

---

<a name="한국어"></a>
## 🇰🇷 한국어

**Themis AI**는 개발자가 **Vibe Coding**(AI와 함께하는 초고속 개발)을 즐기면서도, 시스템의 **건축적 무결성**과 **문서화**를 완벽하게 유지할 수 있도록 돕는 AI 에이전트 하네스입니다.

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)를 기반으로 설계되어, Cursor, Claude Desktop, VS Code 등 여러분이 사용하는 AI 에이전트에 즉시 "기억"과 "질서"를 부여합니다.

### 🚀 빠른 시작 (1분 설정)

#### 1. 프로젝트 초기화
터미널에서 아래 명령어를 실행하면 PARA(Projects, Areas, Resources, Archives) 폴더 구조가 자동으로 생성됩니다.
```bash
npx themis-ai init
```

#### 2. AI 에이전트 연결 (MCP)
사용 중인 툴의 MCP 설정에 다음을 추가하세요.

#### **Cursor / Claude Desktop 설정**
- **Type**: `command`
- **Command**: `npx`
- **Args**: `-y`, `themis-ai`

### 🛠️ 핵심 기능
- **컨텍스트 최적화**: 현재 작업에 꼭 필요한 맥락만 추출하여 토큰 소모를 줄이고 AI의 정확도를 높입니다.
- **자율형 가비지 컬렉션 (GC)**: 완료된 프로젝트를 자동으로 아카이브하여 작업 공간을 항상 깔끔하게 유지합니다.
- **보안 방어벽**: `.env`, API Key 등 민감한 파일이 외부로 유출되지 않도록 `.gitignore`를 자동으로 관리합니다.

---

## 🏗️ Architecture
- **Core Engine**: VRAM monitoring & knowledge extraction.
- **MCP Server**: Supports Stdio & SSE protocols.
- **PARA Manager**: Knowledge indexing based on directory structures.

## 👤 Author
- **Name**: Seung Heon Song
- **Email**: [esketch@gmail.com](mailto:esketch@gmail.com)
- **GitHub**: [@esketch-ai](https://github.com/esketch-ai)

## 📄 License
ISC License. Copyright (c) 2026, Seung Heon Song.
