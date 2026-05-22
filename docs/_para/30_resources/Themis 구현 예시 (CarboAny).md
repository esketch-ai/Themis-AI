
현재 `docs/` 디렉토리 하위에 구축된 `_para/` 폴더 구조와 문서들을 분석하여, 정책이 잘 적용되었는지 확인하고 향후 유지보수를 위한 제언을 정리했습니다.

---

### 1. 현재 문서 정리 현황 요약

`docs/_para/` 하위에 PARA(Projects, Areas, Resources, Archives) 방법론이 명확하게 구조화되어 적용되어 있습니다.

*   **`00_inbox/`**: 미분류 임시 문서 보관함.
*   **`10_projects/`**: 진행 중인 프로젝트 및 작업 (마감/목표 존재).
    *   `citizen-routing-qaqc/` (Active)
    *   `participant-app-storyboard-uplift/` (Ready for Development)
    *   `sponsor-portal-storyboard-uplift/` (Planning)
*   **`20_areas/`**: 상시 유지되어야 하는 운영 기준 및 정책 (장기 운영 영역).
    *   제품 아키텍처, QAQC 기준, 런북, Codex Harness 정책(`codex-harness.md`, `superpowers.md` 등) 및 문서화 시스템 정책 존재.
*   **`30_resources/`**: 참고 자료, 원천 지식, 방법론.
    *   제품 전략, AI 오케스트레이션(Gemini), 탄소 크레딧 방법론(MRV Evidence Protocol), 규제 및 특허 관련 인덱스 문서 존재.
*   **`40_archive/`**: 완료되었거나 비활성 상태인 과거 문서 (`YYYY-MM` 월별 관리).

---

### 2. PARA 기법 정의에 따른 운용 정책 검토

`docs/_para/20_areas/documentation-system.md` 및 각종 `README.md`에 명시된 운용 정책은 매우 체계적이며 훌륭하게 설계되어 있습니다. 핵심 운영 원칙은 다음과 같습니다.

> [!TIP]
> **작업 생애주기 (Workflow)**
> 1. **시작**: 모든 새로운 개발/QA 작업은 `10_projects/<project-slug>/`에서 시작하며, 해당 폴더 내에 `README.md`와 진행 과정을 담습니다.
> 2. **종료 및 회고**: 작업 완료 시 프로젝트 상태를 `Completed`로 변경하고, `CHANGE_SUMMARY.md`를 작성하여 변경 사항을 구조화합니다.
> 3. **지식 자산화**: 작업 중 도출된 새로운 '운영 규칙'이나 '표준'은 `20_areas/`로 업데이트하고, 참고할 '원문/지식'은 `30_resources/`로 이관합니다.
> 4. **보관 (Archiving)**: 일회성 산출물, 상세 로그, 완료된 프로젝트 폴더는 `40_archive/YYYY-MM/<topic>/`으로 이동시켜 작업 공간을 항상 깔끔하게 유지합니다.

> [!IMPORTANT]
> **보안 및 예외 정책 (Strict Rule)**
> 특허 청구항이나 기술 스펙 등 민감 문서가 위치한 `docs/expert_specs/` 및 `docs/patent_working/` 등은 별도 관리 구역이므로 **사전 승인 없이 PARA 내부로 이동하거나 수정하지 않는다**는 규칙이 강력하게 적용되어 있습니다.

---

### 3. 검토 의견 및 향후 개선 제언

현재의 구조는 Codex(AI 에이전트)가 컨텍스트를 파악하고 라우팅하기에 매우 최적화되어 있습니다(Codex Harness 친화적). 다만, 루트 경로(`docs/`) 정리에 대한 일부 후속 조치를 제안합니다.

1.  **루트(`docs/`) 디렉토리의 레거시 폴더 이관 검토**
    *   현재 `docs/` 루트 경로에 `design-samples/`, `methodology/`, `plans/`, `pptx/`, `regulatory/`, `strategic_review/` 폴더들과 PDF 파일이 남아있습니다.
    *   특허 관련(`expert_specs`, `patent_working`, `PATENT_WORKING_MAP...`)을 제외한 나머지 폴더/파일들은 PARA 정책에 따라 `_para/30_resources/` (참고자료) 또는 `_para/40_archive/` (과거 자료)로 마이그레이션(이동)하는 것을 권장합니다. 이를 통해 엔트리포인트를 완벽하게 단일화할 수 있습니다.
2.  **프로젝트 템플릿화**
    *   `10_projects/` 하위에 새 프로젝트 생성 시 자동으로 `README.md`, `DEVELOPMENT_PLAN.md`, `CHANGE_SUMMARY.md`의 보일러플레이트를 구성해주는 스니펫이나 템플릿 문서를 `20_areas/` 쪽에 두면 일관성 유지에 더욱 좋을 것입니다.
3.  **문서화 무결성 유지**
    *   향후 AI를 통한 작업 지시 시, *"작업 완료 후 반드시 CHANGE_SUMMARY.md를 작성하고 문서를 40_archive로 이관할 것"*이라는 프롬프트 룰을 지속해서 적용하면 이 훌륭한 시스템이 훼손되지 않고 자동 유지될 것입니다.
