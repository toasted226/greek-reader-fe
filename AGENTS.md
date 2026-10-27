# AGENTS.md

## What this is

Greek Reader — an Angular 22 application designed for studying and reading Modern Greek texts with automated lexical parsing, glosses, and morphological breakdowns.

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
