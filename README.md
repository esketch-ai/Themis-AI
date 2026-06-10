# 🏛️ Themis AI: Cognitive OS Harness (MCP Server)

> **"Sustainable Vibe Coding for Professional Engineers."**  
> AI와 함께하는 초고속 개발(Vibe Coding)의 속도는 유지하면서, 시스템의 무결성과 문서화의 질을 타협하지 마세요.

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![MCP Native](https://img.shields.io/badge/MCP-Native-orange.svg)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/Version-1.0.0-green.svg)](https://github.com/esketch-ai/Themis-AI)

[English](#-english) | [한국어](#-한국어)

---

<a name="english"></a>
## 🌍 English

### 🎯 What is Themis AI?
Themis AI acts as a **Cognitive OS Harness** for your development environment. While most AI agents suffer from "context amnesia" and "documentation drift" in long-running projects, Themis provides a structured memory layer based on the **PARA Methodology**.

By integrating Themis into your AI (Cursor, Claude, etc.), you empower your agent to:
1. **Never Forget**: Maintain a clean, indexed knowledge base of decisions and specs.
2. **Save Tokens**: Selectively serve only relevant context, preventing context bloat.
3. **Self-Organize**: Automatically archive completed tasks and extract new architectural rules.

### 🚀 Quick Start

#### 1. Zero-Install Initialization
Set up your PARA structure in any project directory with a single command:
```bash
npx themis-ai init
```
This creates a `docs/_para/` structure and a secure `.gitignore` to prevent secret leaks.

#### 2. Connect Your Agent (MCP)
Themis follows the **Model Context Protocol**. Add it to your client (e.g., Cursor or Claude Desktop):
- **Command**: `npx -y themis-ai`
- **Environment**: Supports Mac, Windows (WSL), and Linux.

---

### 🛠️ Advanced Toolset
- **`get_optimized_context`**: Distills current project `README` and `DEVELOPMENT_PLAN` to give the AI precise focus without wasting tokens.
- **`trigger_context_gc`**: Our unique **Garbage Collection** engine. It identifies completed project folders and moves them to `40_archive`, keeping the AI's "active memory" lean.
- **`validate_para_integrity`**: A system health check that ensures every project has a clear goal, a plan, and a handoff document.

---

<a name="한국어"></a>
## 🇰🇷 한국어

### 🎯 Themis AI란 무엇인가요?
Themis AI는 개발 환경을 위한 **인지 OS 하네스(Cognitive OS Harness)**입니다. 대규모 프로젝트나 장기 프로젝트에서 AI 에이전트가 겪는 "기억 상실(Amnesia)"과 "문서화 누락(Documentation Drift)" 문제를 **PARA 방법론** 기반의 구조화된 메모리 레이어로 해결합니다.

Themis를 여러분의 AI(Cursor, Claude 등)에 연결하면 다음과 같은 초능력을 부여할 수 있습니다:
1. **망각 방지**: 결정 사항과 기술 스펙을 인덱싱된 지식 창고에 체계적으로 유지합니다.
2. **토큰 절약**: 불필요한 파일 대신 현재 작업에 꼭 필요한 맥락만 선별하여 AI에게 제공합니다.
3. **자율 정리**: 완료된 작업은 자동으로 아카이브하고, 새로운 아키텍처 규칙을 추출하여 시스템화합니다.

### 🚀 빠른 시작

#### 1. 1초 설치 및 초기화
어떤 프로젝트 폴더에서든 다음 명령어를 실행하여 PARA 구조를 즉시 구축하세요:
```bash
npx themis-ai init
```
이 명령어는 `docs/_para/` 폴더 구조를 생성하고, API Key 유출을 방지하는 보안 `.gitignore` 설정을 자동으로 수행합니다.

#### 2. AI 에이전트 연결 (MCP)
Themis는 **Model Context Protocol**을 준수합니다. Cursor나 Claude Desktop 설정에 아래를 추가하세요:
- **실행 명령**: `npx -y themis-ai`
- **호환성**: Mac, Windows(WSL), Linux 등 모든 환경을 지원합니다.

---

### 🛠️ 핵심 도구 가이드
- **`get_optimized_context`**: 프로젝트의 `README`와 `개발 계획`을 요약하여 AI가 작업의 핵심 목표에만 집중하게 만듭니다.
- **`trigger_context_gc`**: Themis만의 독보적인 **가비지 컬렉션(GC)** 엔진입니다. 완료된 프로젝트 폴더를 찾아 `40_archive`로 이동시킴으로써 AI의 "활동 기억"을 항상 가볍게 유지합니다.
- **`validate_para_integrity`**: 모든 프로젝트가 명확한 목표와 계획, 인수인계 문서를 갖추고 있는지 시스템 건강 검진을 수행합니다.

---

## 📂 PARA Directory Structure
Themis는 여러분의 지식을 4가지 영역으로 관리합니다:
1. **10_projects**: 현재 진행 중인 구체적인 목표가 있는 작업.
2. **20_areas**: 지속적으로 유지되는 기술 표준 및 정책 (아키텍처, 코드 스타일).
3. **30_resources**: 참고용 지식 소스 및 리서치 자료.
4. **40_archive**: 완료된 작업들의 거대한 기록 보관소.

## 👤 Author
- **Name**: Seung Heon Song
- **Email**: [esketch@gmail.com](mailto:esketch@gmail.com)
- **GitHub**: [@esketch-ai](https://github.com/esketch-ai)

## 📄 License
ISC License. Copyright (c) 2026, Seung Heon Song.
