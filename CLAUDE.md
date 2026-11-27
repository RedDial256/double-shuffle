# Double Shuffle

Read `README.md` first, then the docs in `docs/`. The Expo app lives in `app/`
and has its own `app/AGENTS.md`.

## Keep the roadmap current

`docs/roadmap.md` is the plan to v1. Whenever a change finishes a roadmap item,
opens or closes a decision, or changes scope, update `docs/roadmap.md` in the
same change and bump its "Last updated" date. Delete finished or stale content
rather than striking it out, and put the reasoning for decisions in
`docs/decisions.md`. Keep the GitHub milestones and issues in step with it.

## Working with the user

* Record feedback the user gives that will matter in future sessions in this
  file, in the same change or in a small follow-up PR.

## Workflow

* Do code work on a branch, in a git worktree. Never edit the main checkout
  directly.
* Changes reach `main` through pull requests.
* Branch names are `claude/<issue>-<short-description>` in kebab-case, for
  example `claude/21-add-new-feature` or `claude/33-fix-game-loop-bug`. When
  there is no issue for the work, leave the number out:
  `claude/fix-game-loop-bug`.
* Every PR runs the rnsec security audit.
* GitHub Actions orchestrates CI (typecheck, lint, tests) and the EAS deploys
  described in `docs/roadmap.md`.

## Stack decisions

* Navigation uses Expo Router.
* Versioning is SemVer, automated with release-please and Conventional
  Commits: 0.x during development, then `1.0.0-beta.N`, `1.0.0-rc.N`,
  `1.0.0`. Pre-release labels use a dot (`beta.10` sorts after `beta.9`).

## Conventions

* Everything in English: code, comments, UI text, commit messages, docs.
* Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:` …).
* Commit messages never mention conversations, sessions or AI authorship: no
  `Co-Authored-By` trailers for an AI, no session links.
