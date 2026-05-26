# Nano Edit

Nano Edit is an embeddable editor package for quiet, Markdown-native document editing.

## Language

**Editor Package**:
An embeddable package that provides the editor engine, view, codecs, commands, and indexes without owning the host product.
_Avoid_: App, demo app, Markdown viewer

**Demo Host**:
A minimal local host used to exercise the editor package and verify the default document experience.
_Avoid_: Product app, showcase page, landing page

**Quiet Surface**:
An editing surface where document content stays primary and Markdown syntax or editor chrome appears only when it is directly useful for editing.
_Avoid_: Feature showcase, toolbar-heavy editor, decorative demo

**Markdown-Native Document**:
A document that can be edited as rich content while treating Markdown as one supported expression of the document.
_Avoid_: Plain textarea, HTML document, Notion-style page

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
- A **Markdown-Native Document** is represented internally as a **Nano Document**.
- Markdown is one expression of a **Markdown-Native Document**, not the document's sole source of truth.
- A **Source Choice** may be stored in a **Nano Document** when it affects editing expression.
- A **Source Mark** belongs to a **Nano Document** and preserves Markdown source that should round-trip literally.

## Example dialogue

> **Dev:** "Should the demo explain every supported Markdown feature?"
> **Domain expert:** "No — the **Demo Host** should feel like a compact note. The **Editor Package** can expose capabilities without turning the surface into a showcase."

> **Dev:** "Is this just a Markdown textarea with prettier styling?"
> **Domain expert:** "No — it is a **Quiet Surface** over a **Nano Document**, with Markdown import and export kept as a first-class contract."

> **Dev:** "Do we need to preserve every byte of the original Markdown?"
> **Domain expert:** "No — Markdown is one expression of the document. Preserve **Source Choices** that matter to editing, and normalize incidental syntax."

## Flagged ambiguities

- "app" was used loosely for the local demo; resolved: Nano Edit is primarily an **Editor Package**, and the local app is a **Demo Host**.
- "Markdown-native" was ambiguous; resolved: Markdown is an important expression and interchange format, but the **Nano Document** is the editor's structured source of truth.
- LLM-driven extension/catalog assembly was discussed, but it is deferred future direction rather than Nano Edit's current core responsibility.
