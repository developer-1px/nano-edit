# Nano Edit

Nano Edit's working identity is Nano Editable: a contenteditable-based editing foundation for quiet, Markdown-native local editing features.

## Language

**Nano Editable**:
A contenteditable-based editing foundation that provides reusable feature seams for rendered text and document surfaces.
_Avoid_: Native input lifecycle, textarea helper, select/form package, app

**Editor Package**:
An embeddable package that provides the contenteditable editor engine, view, codecs, commands, and indexes without owning the host product.
_Avoid_: App, demo app, Markdown viewer, native form-control toolkit

**Contenteditable Surface**:
A browser editing surface backed by `contenteditable` behavior, DOM Selection, Input Events, and IME-sensitive text mutation.
_Avoid_: Native input, textarea, select, form field

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

**Autocomplete**:
A reusable anchored option surface for slash commands, mentions, reference pickers, and command palettes, with keyboard interaction and ARIA listbox semantics independent of any one document model.
_Avoid_: App launcher, toolbar menu, Nano-only command palette

**Interaction Ownership**:
A focused keyboard/focus arbitration boundary that decides which surface currently owns a key event, such as a command palette, deck rail, or inspector tab list.
_Avoid_: Global keydown soup, duplicated arrow-key handlers, ARIA attributes without behavior

**Integrator Reader**:
A developer evaluating Nano Edit for a product that displays generated Markdown and needs quiet local editing.
_Avoid_: End-user reader, library maintainer, marketing visitor

**Local Edit**:
A small human edit to a specific part of a generated document.
_Avoid_: Full rewrite, source-mode editing session

**Inline Edit**:
A focused contenteditable local edit lifecycle for a small rendered text region, including commit, cancel, selection offset, paste normalization, and focus restore without requiring the host to adopt the full editor surface.
_Avoid_: Full editor session, form builder, native input lifecycle, global source mode

**Inline Autocomplete**:
An optional extension that maps inline triggers such as mention and slash to autocomplete contexts and insertion behavior on top of Inline Edit.
_Avoid_: Full editor plugin framework, host-specific mention system

**Package Taxonomy**:
The decomposition rule for Nano Edit parts: **core** owns small state, lifecycle, and algorithms; **extension** adds optional editing behavior; **adapter-provider** connects a runtime or external system; **assembly** composes ready-to-use product surfaces.
_Avoid_: Large app boundary, package per helper, runtime-agnostic abstraction for its own sake

**ProseMirror Runtime Provider**:
An internal adapter-provider for reliable contenteditable document editing, selection mapping, input handling, and DOM synchronization.
_Avoid_: Public identity, required consumer mental model, private implementation import

**zod-crud Document Foundation**:
The internal document-state foundation used for schema-safe state, patches, history, persistence pressure, and JSON-boundary discipline.
_Avoid_: Public identity, app state manager, private subpath dependency

**Self-Contained Internal Module**:
An internal folder whose files share one reason to change and whose filenames rely on the folder for long context instead of repeating project-wide prefixes.
_Avoid_: Prefix-based file pile, helper-per-file SRP, folder created only because a file is large

**Scalar Edit Adapter**:
A thin host-facing helper over contenteditable Inline Edit for editing one string value, such as a chat message, component label, or JSON-pointer-backed admin preview field.
_Avoid_: Block composer, document surface, native input helper, host-specific form engine

**Native Form Edit**:
An edit lifecycle based on `input`, `textarea`, or `select` elements.
_Avoid_: Nano core responsibility, contenteditable feature seam

**Consumer Blind Dogfooding**:
A package API diagnostic where agents receive only exports, public signatures, and a host requirement, then classify assembly failures before the result is treated as API feedback.
_Avoid_: Demo copying, implementation spelunking, pass/fail contest

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

- **Nano Editable** is the working identity for Nano Edit as a **Contenteditable Surface** foundation.
- The **Editor Package** can be mounted by one or more host products.
- The **Demo Host** exists to validate the **Editor Package**, not to define product scope.
- A **Quiet Surface** is the default user-facing expression of the **Editor Package**.
- A **Quiet Surface** should behave as a **View-First Editing Surface**.
- **Generated Markdown** is imported as a **Markdown-Native Document** for review and **Local Edits**.
- A **Self-Describing Demo Document** may explain Nano Edit's capabilities through document content, while the editing affordances remain quiet and inline.
- **Document-Like Guidance** may tell readers how to try Nano Edit when it remains part of the document rather than separate instructional chrome.
- **Autocomplete** can be reused by the **Editor Package** and by host-product inline affordances such as mention, slash, tag, and reference pickers.
- **Interaction Ownership** backs keyboard behavior for reusable surfaces; ARIA roles are considered incomplete unless the matching arrow, enter, escape, focus, and ownership behavior is covered by interaction tests.
- The primary reader of a **Self-Describing Demo Document** is an **Integrator Reader**.
- An **Inline Edit** can power contenteditable table cells, chat message patches, component labels, and Markdown inline tokens without requiring the full **View-First Editing Surface**.
- **Inline Autocomplete** turns **Inline Edit** selection offsets and trigger input into **Autocomplete** contexts without forcing mention, slash, or option data into core.
- A **Scalar Edit Adapter** may be built from **Inline Edit** and optionally **Inline Autocomplete**, but it should not pull in the full **Editor Package** or **Demo Host**.
- The **Package Taxonomy** keeps reusable pieces small enough for LLM assembly while avoiding package over-splitting.
- **Inline Edit** and **Autocomplete** are **core** candidates; **Inline Autocomplete** composes them as an **extension**; mention and slash behavior are extension configuration; React, zod-crud, ProseMirror, DOM, and interaction bridges are **adapter-provider** candidates; the current demo host is an **assembly**.
- **ProseMirror Runtime Provider** and **zod-crud Document Foundation** are natural internal supports for the contenteditable foundation, not the public identity a feature consumer must learn first.
- **Native Form Edit** is outside Nano core. It can remain host-owned, live in another package, or become pressure for a lab only when the surface is rebuilt as a **Contenteditable Surface**.
- **Consumer Blind Dogfooding** is the preferred evidence check before promoting an internal boundary or changing a core API for LLM assembly.
- A part should usually stay as an internal package boundary until a second real host or second runtime pressure justifies external package promotion.
- A **Self-Contained Internal Module** is the preferred internal shape before package promotion: folder names carry context, public facades stay stable, and implementation files use local responsibility names.
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

> **Dev:** "Is this a wrapper around ProseMirror?"
> **Domain expert:** "No - ProseMirror is a **Runtime Provider**. The public identity is a contenteditable editing foundation."

> **Dev:** "Can I replace a spreadsheet input cell editor with Inline Edit?"
> **Domain expert:** "Only if that cell editor is rebuilt as a **Contenteditable Surface**. Native form-control edit lifecycles are outside Nano core."

## Flagged ambiguities

- "app" was used loosely for the local demo; resolved: Nano Edit is primarily an **Editor Package**, and the local app is a **Demo Host**.
- "editor" can imply an authoring-first workspace; resolved: Nano Edit is a **View-First Editing Surface** for reviewing and locally editing generated documents.
- "feature showcase" was too broad; resolved: demo content may introduce Nano Edit through a **Self-Describing Demo Document**, but editor chrome must stay quiet.
- "usage guidance" was too broadly discouraged; resolved: **Document-Like Guidance** is allowed when it keeps the demo document-like.
- "Markdown-native" was ambiguous; resolved: Markdown is an important expression and interchange format, but the **Nano Document** is the editor's structured source of truth.
- LLM-driven extension/catalog assembly is no longer treated as app scope; resolved: use the **Package Taxonomy** to make Nano Edit easier for LLMs to assemble without repeatedly rebuilding obvious editing primitives.
- "ARIA is present" was too weak as evidence of keyboard support; resolved: verify **Interaction Ownership** with behavior tests for the surface that owns focus.
- "inline edit package" can be too broad; resolved: keep **Inline Edit** as contenteditable primitive lifecycle/helpers and put reusable one-value host hooks under **Scalar Edit Adapter**.
- "text input" can imply native form controls; resolved: Nano core owns **Contenteditable Surface** features, while **Native Form Edit** stays outside core.
- "ProseMirror" and "zod-crud" can sound like the product identity; resolved: they are provider/foundation roles behind the contenteditable public identity.
- "SRP refactor" can over-fragment the codebase; resolved: prefer **Self-Contained Internal Modules** grouped by shared change reason over prefix-heavy helper files.
