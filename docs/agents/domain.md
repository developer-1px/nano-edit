# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- `CONTEXT.md` at the repo root.
- `docs/adr/`, if present, for architectural decisions that touch the area being changed.

If any of these files do not exist, proceed silently. The producer skill creates them lazily when terms or decisions are resolved.

## Layout

This is a single-context repo.

## Use the glossary's vocabulary

When naming domain concepts in issues, PRDs, tests, or implementation notes, use the terms defined in `CONTEXT.md`. Avoid synonyms that the glossary explicitly rejects.

If the needed concept is missing from the glossary, either reconsider whether the concept belongs in this repo or note it for a future glossary discussion.

## Flag ADR conflicts

If output contradicts an existing ADR, surface the contradiction explicitly instead of silently overriding it.
