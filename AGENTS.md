# AGENTS.md

## What this is

Greek Reader — an Angular 22 application designed for studying and reading Modern Greek texts with automated lexical parsing, glosses, and morphological breakdowns.

## Required Workflow

Every change, fix, feature, or refactor must follow the `plan-and-implement` skill (`.opencode/skills/plan-and-implement/SKILL.md`, also available as `.agents/skills/plan-and-implement/SKILL.md`). Load it before starting work. In short:

1. **Check the docs first.** Read `README.md` and any relevant `docs/` or `.kiro/steering/` page. State exactly which documented behaviour changes and which file/section needs updating, or say "No README/doc impact."
2. **Plan, then stop.** Propose numbered steps that are each independently reviewable: small, single-purpose, leaving the repo compiling and tests passing, naming the files touched and how to verify. List assumptions and open questions. Do not edit files until the user approves.
3. **One step per approval.** On "go" / "next" / "implement", do only the next unfinished step, report `Step N of M complete` with files, verification, and plan notes, then pause for review. Never start the following step without a new approval.
4. **Close with post-task steps.** After the final step, list test coverage and `bun run test`, build and manual verification (`bun run build`), the exact documentation updates, and any follow-ups.

## Package Manager & Tooling

**Always use `bun`** for package management, dependency installation, and running scripts in this project.

### Commands

| Task | Command |
| --- | --- |
| Install dependencies | `bun install` |
| Run test suite | `bun run test` |
| Build application | `bun run build` |
| Start dev server | `bun run start` |
| Serve SSR build | `bun run serve:ssr:greek-reader` |
| Add dependency | `bun add <package>` |
| Add dev dependency | `bun add -d <package>` |

## Guidelines

- Use standalone Angular components and signals.
- Use Tailwind CSS utility classes and theme tokens configured in `src/styles.css`.
- Ensure all tests pass via `bun run test` and builds compile via `bun run build`.
