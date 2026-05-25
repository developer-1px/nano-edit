# Nano Edit

Nano Edit is an embeddable editor package for assembling quiet, Markdown-native editing capabilities into host products.

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

**Extension**:
A composable editor capability that can add document structure, commands, input behavior, rendering, indexing, or codecs.
_Avoid_: Part, feature part, capability

**Kit**:
A named bundle of Extensions selected for a host product or editing workflow.
_Avoid_: Preset, package, feature bundle

**Extension Catalog**:
The discoverable list of Extensions available for host products or generation systems to compose into Kits.
_Avoid_: Part catalog, capability catalog

## Relationships

- The **Editor Package** can be mounted by one or more host products.
- The **Demo Host** exists to validate the **Editor Package**, not to define product scope.
- A **Quiet Surface** is the default user-facing expression of the **Editor Package**.
- An **Extension** is the smallest product-level unit a host should choose.
- A **Kit** contains one or more **Extensions**.
- The **Extension Catalog** helps a host or generation system choose Extensions for a Kit.

## Example dialogue

> **Dev:** "Should the demo explain every supported Markdown feature?"
> **Domain expert:** "No — the **Demo Host** should feel like a compact note. The **Editor Package** can expose capabilities without turning the surface into a showcase."

> **Dev:** "Does this host need tables, todos, and footnotes?"
> **Domain expert:** "Choose those **Extensions** from the **Extension Catalog** and ship them as the host's note-taking **Kit**."

## Flagged ambiguities

- "app" was used loosely for the local demo; resolved: Nano Edit is primarily an **Editor Package**, and the local app is a **Demo Host**.
- "feature part" and "capability" were used for composable editor pieces; resolved: the domain term is **Extension**, and grouped selections are **Kits**.
