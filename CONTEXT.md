# Nano Edit

Nano Edit is an embeddable editor package for quiet, Markdown-native document editing.

## Language

**Editor Package**:
An embeddable package that provides the editor engine, view, codecs, commands, and indexes without owning the host product.
_Avoid_: App, demo app, Markdown viewer

**Demo Host**:
A local host used to exercise the editor package and show how generated Markdown can be reviewed and locally edited.
_Avoid_: Product app, landing page, decorative showcase

**Quiet Surface**:
An editing surface where document content stays primary and Markdown syntax or editor chrome appears only when it is directly useful for editing.
_Avoid_: Toolbar-heavy editor, decorative chrome, always-on source mode

**View-First Editing Surface**:
An editing surface that preserves the feel of a document viewer while allowing local, in-place edits.
_Avoid_: Authoring-first editor, source editor, block app

**Markdown-Native Document**:
A document that can be edited as rich content while treating Markdown as one supported expression of the document.
_Avoid_: Plain textarea, HTML document, Notion-style page

**Generated Markdown**:
Markdown produced primarily by an AI system and then reviewed or locally edited by a person.
_Avoid_: Hand-authored draft, canonical source file

**Self-Describing Demo Document**:
A generated-looking Markdown document that explains Nano Edit itself, including its purpose, usage, and structure.
_Avoid_: Marketing page, decorative showcase, unrelated sample note

**Document-Like Guidance**:
Usage guidance written as part of the document's content instead of as surrounding application chrome.
_Avoid_: Floating tutorial, command cheat sheet, UI tour

**Integrator Reader**:
A developer evaluating Nano Edit for a product that displays generated Markdown and needs quiet local editing.
_Avoid_: End-user reader, library maintainer, marketing visitor

**Local Edit**:
A small human edit to a specific part of a generated document.
_Avoid_: Full rewrite, source-mode editing session

**Source Choice**:
A Markdown authoring choice that affects the editing expression enough to preserve in structured state.
_Avoid_: Byte-perfect source, incidental whitespace, parser trivia

**Nano Document**:
The structured document state that stores blocks, inline marks, and source-preserving attributes for the editor.
_Avoid_: ProseMirror document, Markdown string, DOM state

**Source Mark**:
An inline mark used to preserve exact Markdown gesture text when the editor cannot or should not reinterpret it as richer structure.
_Avoid_: Decoration, visible token, escaped text

## Relationships

- The **Editor Package** can be mounted by one or more host products.
- The **Demo Host** exists to validate the **Editor Package**, not to define product scope.
- A **Quiet Surface** is the default user-facing expression of the **Editor Package**.
- A **Quiet Surface** should behave as a **View-First Editing Surface**.
- **Generated Markdown** is imported as a **Markdown-Native Document** for review and **Local Edits**.
- A **Self-Describing Demo Document** may explain Nano Edit's capabilities through document content, while the editing affordances remain quiet and inline.
- **Document-Like Guidance** may tell readers how to try Nano Edit when it remains part of the document rather than separate instructional chrome.
- The primary reader of a **Self-Describing Demo Document** is an **Integrator Reader**.
- A **Markdown-Native Document** is represented internally as a **Nano Document**.
- Markdown is one expression of a **Markdown-Native Document**, not the document's sole source of truth.
- A **Source Choice** may be stored in a **Nano Document** when it affects editing expression.
- A **Source Mark** belongs to a **Nano Document** and preserves Markdown source that should round-trip literally.

## Example dialogue

> **Dev:** "Should the demo explain every supported Markdown feature?"
> **Domain expert:** "It can, and it should preferably explain Nano Edit itself as a **Self-Describing Demo Document**. The surface should still feel quiet and inline-editable."

> **Dev:** "Is this just a Markdown textarea with prettier styling?"
> **Domain expert:** "No — it is a **Quiet Surface** over a **Nano Document**, with Markdown import and export kept as a first-class contract."

> **Dev:** "Do we need to preserve every byte of the original Markdown?"
> **Domain expert:** "No — Markdown is one expression of the document. Preserve **Source Choices** that matter to editing, and normalize incidental syntax."

> **Dev:** "Why hide most editor controls and Markdown syntax?"
> **Domain expert:** "Most Markdown will be **Generated Markdown** that people only review or locally adjust. Keep the surface view-first and expose editing affordances only around the **Local Edit**."

> **Dev:** "Can the demo say how to try the editor?"
> **Domain expert:** "Yes, if the guidance reads like part of the **Self-Describing Demo Document**, not a separate UI tour."

> **Dev:** "Who is the demo written for?"
> **Domain expert:** "An **Integrator Reader** deciding whether Nano Edit fits a generated-Markdown product with quiet local edits."

## Flagged ambiguities

- "app" was used loosely for the local demo; resolved: Nano Edit is primarily an **Editor Package**, and the local app is a **Demo Host**.
- "editor" can imply an authoring-first workspace; resolved: Nano Edit is a **View-First Editing Surface** for reviewing and locally editing generated documents.
- "feature showcase" was too broad; resolved: demo content may introduce Nano Edit through a **Self-Describing Demo Document**, but editor chrome must stay quiet.
- "usage guidance" was too broadly discouraged; resolved: **Document-Like Guidance** is allowed when it keeps the demo document-like.
- "Markdown-native" was ambiguous; resolved: Markdown is an important expression and interchange format, but the **Nano Document** is the editor's structured source of truth.
- LLM-driven extension/catalog assembly was discussed, but it is deferred future direction rather than Nano Edit's current core responsibility.
