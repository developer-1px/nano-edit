# Self-Describing Demo Document

Status: needs-triage

## Problem Statement

Nano Edit's current demo document reads like a compact sample note. That proved the quiet editing surface, but it does not explain what Nano Edit is, who it is for, or why its view-first editing model matters.

The intended reader is an Integrator Reader: a developer evaluating whether Nano Edit can display Generated Markdown inside a host product while allowing small Local Edits. The demo should therefore describe Nano Edit itself, but it should still feel like a Markdown document generated for review, not like a marketing page, command tour, or toolbar-heavy product manual.

The current quiet demo regression rules also overcorrect toward "no feature showcase." They block repo-specific explanatory content that now belongs in the Demo Host. The tests need to distinguish document-like self-description from decorative chrome or UI-manual copy.

## Solution

Replace the demo seed with a Self-Describing Demo Document. The document should explain Nano Edit's purpose, usage shape, and internal composition in a generated-looking Markdown form. It should include natural examples of headings, paragraphs, todos, tables, links, code, and other supported structures where they help the document communicate the package.

The editing surface should stay quiet and view-first. Markdown source markers, command chrome, inspector labels, and block controls should remain local to the edit context. The demo may contain Document-Like Guidance such as "try editing this checklist item," but that guidance must be part of the document body, not separate application chrome.

Update the demo persistence version so existing local demo state does not hide the new seed document. Update the quiet demo tests so they protect the new product intent: self-description is allowed, but decorative showcase copy, unrelated sample content, and UI-tour wording remain discouraged.

## User Stories

1. As an Integrator Reader, I want the demo document to state what Nano Edit is, so that I can quickly tell whether the package fits my product.
2. As an Integrator Reader, I want the demo to explain that Nano Edit is an embeddable Editor Package, so that I do not mistake the Demo Host for the product.
3. As an Integrator Reader, I want the demo to explain view-first editing, so that I understand why the surface looks more like a document than an authoring app.
4. As an Integrator Reader, I want the demo to mention Generated Markdown, so that I can connect the package to AI-produced documents.
5. As an Integrator Reader, I want the demo to show Local Edit scenarios, so that I can imagine users correcting only small parts of generated output.
6. As an Integrator Reader, I want the demo to include Document-Like Guidance, so that I can try editing without leaving the document context.
7. As an Integrator Reader, I want the demo to use a natural document structure, so that it does not feel like a landing page.
8. As an Integrator Reader, I want headings to describe the repo's purpose and structure, so that I can scan the document quickly.
9. As an Integrator Reader, I want a checklist of suggested edits, so that I can test inline editing with minimal effort.
10. As an Integrator Reader, I want a table that maps major editor areas to responsibilities, so that I can understand the package composition.
11. As an Integrator Reader, I want a code block showing a small integration shape, so that I can see the package as an embeddable tool.
12. As an Integrator Reader, I want links to appear as normal document content, so that link editing can be evaluated without special UI.
13. As an Integrator Reader, I want inline emphasis, code, and source-like tokens to appear in context, so that I can inspect quiet source reveal behavior.
14. As an Integrator Reader, I want the document to mention Nano Document, so that I understand the structured source of truth.
15. As an Integrator Reader, I want the document to mention Markdown as one expression of the document, so that I do not assume byte-perfect Markdown preservation is the core goal.
16. As an Integrator Reader, I want the document to describe quiet editing affordances, so that I know where source markers should appear.
17. As an Integrator Reader, I want the demo to avoid decorative app chrome, so that I can judge the document surface rather than a themed wrapper.
18. As an Integrator Reader, I want the demo to avoid unrelated sample-note content, so that every section teaches me something about Nano Edit.
19. As an Integrator Reader, I want the demo to avoid command cheat-sheet density, so that the document remains readable.
20. As an Integrator Reader, I want the demo to preserve Markdown-native examples, so that import and export behavior remains visible.
21. As an Integrator Reader, I want local edits to persist during the session, so that I can evaluate editing continuity.
22. As an Integrator Reader, I want stale local demo state to reset when the seed changes, so that I actually see the new self-describing document.
23. As an Integrator Reader, I want the document to remain compact enough to read, so that it feels like generated documentation rather than a reference manual.
24. As an Integrator Reader, I want the demo to include enough supported block types to exercise the editor, so that the package surface can be evaluated.
25. As an Integrator Reader, I want the demo to include enough inline mark types to exercise source reveal, so that quiet editing behavior is visible.
26. As an Integrator Reader, I want the demo to show the difference between viewer feel and editability, so that I understand the product's central trade-off.
27. As an Integrator Reader, I want the demo to explain what is out of scope, so that I do not expect a full Markdown source editor or Notion-style block app.
28. As an Integrator Reader, I want the document to be written in a generated-document tone, so that it matches the AI-produced content use case.
29. As a host product developer, I want the demo to avoid global style assumptions, so that I can trust the editor package can be embedded.
30. As a host product developer, I want the demo to show quiet inline edits without requiring a toolbar, so that I can judge whether it fits a review workflow.
31. As a host product developer, I want the demo to keep Markdown copy and serialization meaningful, so that exported content remains useful.
32. As a maintainer, I want regression tests to allow self-description, so that future edits do not fight the product direction.
33. As a maintainer, I want regression tests to reject decorative showcase drift, so that the demo remains document-like.
34. As a maintainer, I want regression tests to cover the demo's required content, so that accidental seed simplification is caught.
35. As a maintainer, I want regression tests to protect quiet surface behavior separately from demo copy, so that visual editing rules do not depend on specific prose.
36. As a maintainer, I want the new demo to reuse existing document parsing and serialization, so that the seed remains a real Markdown-Native Document.
37. As a maintainer, I want no new runtime concept for future LLM catalog assembly in this work, so that the PRD stays focused on Nano Edit's current responsibility.
38. As a maintainer, I want the PRD vocabulary to match the domain glossary, so that future issues stay aligned with the repo's language.

## Implementation Decisions

- Build the new seed as a Markdown-authored Self-Describing Demo Document that is parsed into a Nano Document through the existing Markdown codec.
- Keep the Demo Host as a minimal host. It should not gain surrounding tutorial panels, landing sections, or custom onboarding chrome for this work.
- Preserve the quiet, view-first editing model. Source markers and editing affordances should remain scoped to cursor, selection, or local edit context.
- Allow Document-Like Guidance inside the demo document. Guidance may tell the reader what to try, but it should read as part of the document body.
- Retain a generated-document tone. The document can explain purpose, usage, and composition, but should avoid marketing slogans and decorative copy.
- Use the existing document structures to demonstrate the package: headings, paragraphs, todos, lists, tables, links, inline marks, and code where they fit naturally.
- Update demo persistence versioning so existing local storage does not keep showing the old demo document after the seed changes.
- Reframe quiet demo regressions from "no feature showcase" to "self-describing document allowed, decorative/manual chrome discouraged."
- Keep the Nano Document as the structured source of truth. Markdown remains one expression of the document, not the whole product identity.
- Do not add a new runtime configuration model, Extension Catalog, Kit Manifest, or LLM assembly path in this PRD.
- Treat the demo document seed as a small deep module: it should encapsulate demo content in one stable interface and be testable through Markdown serialization and document indexing.
- Treat the quiet demo regression suite as the behavioral boundary for the Demo Host: tests should assert external document qualities and serialized output, not internal string construction details.

## Testing Decisions

- Good tests should verify externally visible behavior: serialized Markdown content, block and mark coverage, generated-document tone, quiet surface constraints, persistence reset behavior, and absence of decorative chrome.
- Avoid tests that lock down every sentence of the demo. They should protect required content categories and forbidden presentation styles rather than brittle prose.
- Test the demo seed through Markdown serialization so the test proves the seed is a real Markdown-Native Document.
- Test that the demo includes self-describing content about Nano Edit's purpose, view-first editing model, composition, and local editing workflow.
- Test that the demo still includes representative blocks and inline marks needed to exercise the editor surface.
- Test that the demo avoids unrelated sample-note content when the purpose is repo self-description.
- Test that the demo avoids landing-page or UI-tour wording as surrounding product chrome.
- Test that the Demo Host language and scoped styles remain consistent with the quiet document surface.
- Test that storage versioning treats the new seed as a new demo generation and clears older stored demo values.
- Prior art exists in the current quiet demo, quiet command surface, quiet document surface, persistence, Markdown codec, and indexing regression tests.

## Out of Scope

- Building the future LLM Extension Catalog, Kit, Kit Manifest, or Generation System.
- Adding a new application shell, landing page, guided tour overlay, toolbar, or block picker.
- Replacing the Markdown parser or chasing byte-perfect Markdown preservation.
- Reworking the zod-crud document engine, history model, or selection model.
- Changing the public package API unless the demo work reveals a small documentation-only export issue.
- Adding a full source-mode editor.
- Redesigning inspector behavior beyond keeping existing quiet chrome constraints intact.
- Introducing new visual design language unrelated to the document surface.

## Further Notes

This PRD follows the current domain glossary. The key correction from the discussion is that demo self-description is allowed and preferred. The demo should explain Nano Edit, but it must do so as a document that an Integrator Reader can read and locally edit.

This PRD was originally published to the local markdown issue tracker convention under `.scratch/` before the GitHub remote was attached. New tracking work should use `developer-1px/nano-edit` GitHub Issues; keep this file as durable planning context.
