---
name: Plan and Implement
description: 'Required workflow for every development task in this project: check README/docs impact first, propose a plan of small reviewable steps, implement exactly one step per approval then pause for review, and finish with post-task verification and documentation steps. Use whenever the user asks for a change, fix, feature, or refactor.'
---

# Plan-first implementation workflow

The canonical version of this skill lives at
`.opencode/skills/plan-and-implement/SKILL.md`. Read that file and follow it.
The summary below is the contract if the file cannot be read.

1. **Check the docs first.** Read `README.md`, then `docs/`, `.kiro/steering/`,
   and `AGENTS.md` where relevant. Say exactly which documented behaviour the
   task changes and which file/section needs updating — or state "No
   README/doc impact."
2. **Plan, then stop.** Propose numbered steps that are each independently
   reviewable: small, single-purpose, leaving the repo compiling and tests
   passing, naming the files touched and how to verify. List assumptions and
   open questions. Do not edit files until approved.
3. **One step per approval.** On "go"/"next"/"implement", do only the next
   unfinished step, report `Step N of M complete` with files, verification, and
   plan notes, then pause for review. Never chain steps.
4. **Close with post-task steps.** After the final step, list test coverage and
   `bun run test`, build/manual verification (`bun run build`), exact
   documentation updates, and follow-ups.

Always use `bun` for package and script commands.
