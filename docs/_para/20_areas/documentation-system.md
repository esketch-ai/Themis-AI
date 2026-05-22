# Documentation System Policy

## PARA Methodology
Themis AI follows the PARA (Projects, Areas, Resources, Archives) methodology for organizing all project-related knowledge and documentation.

### 1. Structure
- **00_inbox**: Unsorted temporary documents.
- **10_projects**: Active projects and tasks with a specific deadline or goal.
- **20_areas**: Long-term responsibilities and standards (Architecture, QAQC, Documentation Policy).
- **30_resources**: Reference materials, research, and source knowledge.
- **40_archive**: Completed or inactive documents (managed monthly: YYYY-MM).

### 2. Workflow (Life-cycle)
1. **Start**: All new development/QA tasks begin in `10_projects/<project-slug>/`. Each must have a `README.md` and `DEVELOPMENT_PLAN.md`.
2. **Close & Retrospective**: Upon completion, change the status to `Completed` and write a `CHANGE_SUMMARY.md`.
3. **Knowledge Assetization**: Extract new "operating rules" or "standards" to `20_areas/`, and move "reference/knowledge" to `30_resources/`.
4. **Archiving**: Move completed project folders to `40_archive/YYYY-MM/<topic>/`.

### 3. Strict Rules
- **Security**: Sensitive documents in `docs/expert_specs/` and `docs/patent_working/` are restricted. Do not move or modify them without authorization.
- **Consistency**: Always use the templates provided in `20_areas/templates/` for new projects.
