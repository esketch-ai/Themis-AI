# 🏛️ Themis AI: Cognitive OS Harness

**Themis AI**는 개발자가 **Vibe Coding**(AI와 함께하는 빠른 개발)을 즐기면서도, 시스템의 **건축적 무결성**과 **문서화**를 완벽하게 유지할 수 있도록 돕는 AI 에이전트 하네스입니다. 

[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)를 기반으로 설계되어, 여러분이 사용하는 AI 에이전트(Cursor, Claude Desktop, VS Code 등)에 즉시 "기억"과 "질서"를 부여합니다.

---

## 🚀 Quick Start (1-Minute Setup)

별도의 클론이나 복잡한 설치 없이, 여러분의 프로젝트 폴더에서 바로 시작하세요.

### 1. 프로젝트 초기화
터미널에서 아래 명령어를 실행하면 PARA(Projects, Areas, Resources, Archives) 구조가 자동으로 생성됩니다.
```bash
npx themis-ai init
```

### 2. AI 에이전트 연결 (MCP)
여러분이 사용하는 툴의 MCP 설정에 다음을 추가하세요.

#### **Cursor / Claude Desktop**
- **Type**: `command`
- **Command**: `npx`
- **Args**: `-y`, `themis-ai`

---

## 🧠 Core Methodology: PARA

Themis는 Tiago Forte의 **PARA 방법론**을 AI 개발 환경에 최적화하여 구현합니다.

- **10_projects**: 현재 진행 중인 명확한 목표가 있는 작업 (예: `new-auth-system`).
- **20_areas**: 지속적으로 유지되어야 하는 기술 표준 및 정책 (예: `code-style`, `architecture`).
- **30_resources**: 참고용 지식 소스 및 리서치 자료.
- **40_archive**: 완료된 프로젝트들의 기록 보관소.

---

## 🛠️ Themis Tools (AI가 사용하는 도구)

Themis를 연결하면 여러분의 AI 에이전트가 다음 도구들을 사용할 수 있게 됩니다:

- `get_optimized_context`: 현재 프로젝트의 핵심 맥락만 추출하여 토큰 소모를 줄이고 AI의 명확도를 높입니다.
- `list_projects`: 현재 진행 중인 프로젝트들의 상태와 진행률을 한 눈에 파악합니다.
- `validate_para_integrity`: 프로젝트 구조가 표준 정책을 잘 따르고 있는지 건강 검진을 수행합니다.

---

## 🏗️ Architecture

배포 및 확장을 고려한 모듈형 구조로 설계되었습니다:

- **Core Engine**: VRAM 감시 및 지식 추출 엔진.
- **MCP Server**: Stdio 및 SSE(Network) 프로토콜 동시 지원.
- **PARA Manager**: 디렉토리 구조 기반의 지식 인덱싱 시스템.

---

## 🤝 Contributing

Themis는 오픈소스 프로젝트입니다. 버그 제보나 기능 제안은 언제나 환영합니다!

1. Fork it!
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Submit a pull request.

---

## 👤 Author

- **Name**: Seung Heon Song
- **Email**: [esketch@gmail.com](mailto:esketch@gmail.com)
- **GitHub**: [@esketch-ai](https://github.com/esketch-ai)

## 📄 License

ISC License. Copyright (c) 2026, Seung Heon Song.
