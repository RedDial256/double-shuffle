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
* Every PR runs the rnsec security audit.
* GitHub Actions orchestrates CI (typecheck, lint, tests) and the EAS deploys
  described in `docs/roadmap.md`.

## Labels

Keep the label set small. Use only these, plus GitHub's defaults:

* `blocked`: waiting on another issue, PR or external dependency.
* `waiting-user-input`: needs an answer, decision or action from the user.
* `hotfix`: urgent fix that should ship as soon as possible.
* `bugfix`: fixes a bug.
* `needs-manual-test`: add it to every PR whose behaviour Claude could not
  verify itself (touch and gestures, physics feel, on-device performance,
  sound, haptics, visuals, EAS builds), with a "How to test" section in the PR
  body giving exact steps and what to look for. The user removes the label
  after testing.
* `high-priority`: do this before other work in its milestone.

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
