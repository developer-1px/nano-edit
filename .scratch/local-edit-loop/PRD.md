# PRD: Local Edit Loop

Status: needs-triage

## Problem

Nano Edit의 핵심 사용자는 LLM이 생성한 Markdown 문서를 대부분 읽고, 필요한 일부만 직접 고친다. 현재 데모는 Self-Describing Demo Document로 제품 정체성을 잘 보여주지만, 실제로 문서처럼 읽다가 Local Edit를 하고 그 결과가 Nano Document로 보존되는 end-to-end 흐름은 별도 제품 계약으로 고정되어 있지 않다.

이 계약이 없으면 이후 기능을 추가할 때 Quiet Surface가 깨졌는지, Local Edit가 Markdown-Native Document 모델에 남는지, 데모가 단순 기능 소개 화면으로 퇴행했는지 판단하기 어렵다.

## Goal

Self-Describing Demo Document에서 대표적인 Local Edit Loop를 검증한다.

사용자는 데모를 처음 열었을 때 문서를 먼저 읽고, 특정 문단/할 일/표 셀을 조용히 수정하고, 변경 결과가 브라우저 저장소의 Nano Document에 남아야 한다. 편집 중에도 Markdown source editor나 별도 authoring UI가 주 경험으로 드러나면 안 된다.

## Non-Goals

- 전체 Markdown 작성 앱으로 확장하지 않는다.
- 카탈로그, Kit, LLM 선택 모델은 다루지 않는다.
- source-level patch granularity나 협업 편집은 구현하지 않는다.
- 데모에 장식적 설명, marketing hero, 과도한 도움말을 추가하지 않는다.

## User Story

Integrator Reader가 Nano Edit 데모를 연다.

1. 문서는 제품 설명서처럼 바로 읽힌다.
2. 사용자는 필요한 일부 텍스트만 inline으로 고친다.
3. 체크박스나 표 같은 구조도 문서 안에서 직접 바꾼다.
4. 변경 내용은 Nano Document로 저장된다.
5. 다시 읽기 상태로 돌아왔을 때 화면은 여전히 Quiet Surface다.

## Product Contract

- Initial state: Self-Describing Demo Document가 별도 조작 없이 렌더링된다.
- View-first state: 포커스가 없을 때 source widget이나 source editor가 보이지 않는다.
- Local text edit: 문서 본문 일부에 입력한 텍스트가 Nano Document 저장값에 반영된다.
- Local structured edit: todo checked state와 table cell text가 저장값에 반영된다.
- Undo/redo: 대표 Local Edit는 브라우저 키보드 루프에서 되돌리고 다시 적용할 수 있다.
- Persistence: 변경 후 reload해도 저장된 Nano Document가 복원된다.

## Implementation Notes

- 브라우저 수준 회귀 테스트를 추가해 실제 데모 앱에서 Local Edit Loop를 검증한다.
- 테스트는 과도한 데모 UI를 요구하지 않는다. 현재 Quiet Surface를 보존하는 방향으로 작성한다.
- 저장 검증은 데모의 localStorage Nano Document를 기준으로 한다.
- 테스트 데이터는 Self-Describing Demo Document를 사용한다.

## Acceptance Criteria

- A browser regression opens the demo with fresh storage and verifies the self-describing document is visible.
- The regression verifies no source widgets are visible in the initial view-first state.
- The regression performs at least one text Local Edit through browser input and observes the saved Nano Document update.
- The regression toggles a todo item and observes the saved Nano Document update.
- The regression edits a table cell and observes the saved Nano Document update.
- The regression verifies undo/redo for a representative edit.
- The regression reloads the page and verifies edited content persists.
- Existing unit, build, and layout regressions pass.
