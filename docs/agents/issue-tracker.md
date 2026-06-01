# Issue Tracker: GitHub

Issues for this repo live in GitHub Issues:

- Repository: `developer-1px/nano-edit`
- URL: `https://github.com/developer-1px/nano-edit/issues`
- CLI target: `gh issue ... --repo developer-1px/nano-edit`

The local `.scratch/` directory contains historical PRDs and issue drafts created before the GitHub remote was attached. Treat them as internal planning records, not the active issue tracker.

## When a skill says "publish to the issue tracker"

Create or update a GitHub issue with `gh issue create`, `gh issue edit`, or `gh issue comment` against `developer-1px/nano-edit`.

If the output is a PRD-sized document, keep the durable document in `docs/` or `.scratch/` when useful, then publish a GitHub issue that links to the local document path or summarizes the actionable slices.

## When a skill says "fetch the relevant ticket"

Use `gh issue view <number> --repo developer-1px/nano-edit --comments --json ...`.

If the user references a `.scratch/` path, read that file as historical context and then check whether there is a corresponding GitHub issue before taking action.
