---
name: Plan and Implement
description: 'Required workflow for every development task in this project: check README/docs impact first, propose a plan of small reviewable steps, implement exactly one step per approval then pause for review, and finish with post-task verification and documentation steps. Use whenever the user asks for a change, fix, feature, or refactor.'
---

# Plan-first implementation workflow

These rules are mandatory for this repository. Follow them for every task that
changes code, configuration, or documented behaviour.

## Step 1 — Check the task against the documentation

Before planning, read `README.md`. Also read the docs the task touches:

| File                            | Covers                                                         |
| ------------------------------- | -------------------------------------------------------------- |
| `README.md`                     | Install, dev server, scaffolding, build, tests                 |
| `docs/production-deployment.md` | Container, `API_BASE_URL`, ports, SSR host allowlist           |
| `.kiro/steering/*.md`           | Agreed designs and step-by-step plans for in-progress features |
| `AGENTS.md`                     | Agent tooling rules (package manager, conventions)             |

Then state, in one short section:

- **Which documented behaviour this task changes**, naming the exact file and
  section, and what the change to that text will be.
- **Which documented design it conflicts with**, if any.
- If nothing documented changes, say so explicitly: "No README/doc impact."

Do not fold documentation edits silently into the implementation. Surface them
here, then decide with the user whether they belong inside a step or in the
post-task list.

## Step 2 — Propose the plan, then stop

Produce a plan with:

- One or two sentences of intent: the outcome the user should expect.
- A numbered list of steps. Every step must be **independently reviewable**:
  - single-purpose and small enough to read in one pass,
  - leaves the repo compiling and its tests passing,
  - names the files it will touch and the change in each,
  - states how the user can verify that step on its own.
- Dependency order, and which steps are blocked on external input (an API
  contract, a generated client, a decision from the user).
- Assumptions, risks, and any open question. Ask instead of guessing.

Then **stop**. Do not edit, create, or delete files, and do not run generators.
Wait for explicit approval.

## Step 3 — Implement exactly one step per approval

Only start when the user approves, e.g. "go", "implement", "next", "proceed",
"step 1 is fine". Treat approval as applying to the next unfinished step only.

While implementing:

- Change only what that step named. Do not bundle later steps in "while I'm
  here" — note them for later instead.
- If the step cannot be done as planned, or the scope must grow, stop and
  explain why before widening the change.
- Follow `AGENTS.md`: `bun` for all package and script commands, standalone
  components and signals, Tailwind utilities and tokens from `src/styles.css`.

When the step is done, report and pause:

```
Step N of M complete — <one-line result>
Files:      <path> — <what and why>
Verified:   <command run, or what was checked manually>
Plan notes: <anything discovered that changes the remaining steps>
Next:       <the next step, not started>
```

Never begin the next step without a new approval. If the user asks for a
different or reordered step, restate the updated plan briefly before doing it.

## Step 4 — After the last step, list post-task steps

When every planned step is implemented, do not declare the task finished.
Close with a checklist the user can act on:

- **Tests** — the specs that cover the change, gaps that still need a test, and
  `bun run test`.
- **Verification** — `bun run build`, plus concrete manual checks: route(s) to
  open, viewport sizes, SSR/`API_BASE_URL` behaviour, empty and error states.
- **Documentation** — the exact updates from Step 1, by file and section
  (`README.md`, `docs/production-deployment.md`, `.kiro/steering/*.md`), and any
  new doc that should exist.
- **Follow-ups** — anything deferred, plus cleanup such as formatting
  (`bunx prettier --write`) or dead code.

## Anti-patterns

- Editing files before the plan is approved.
- Presenting one giant step, or a plan whose steps only make sense together.
- Implementing several steps after a single "go".
- Skipping Step 1 because the task "clearly" has no docs impact — check first.
- Silently changing documented behaviour, commands, env vars, or ports.
- Calling the task done without the Step 4 checklist.
