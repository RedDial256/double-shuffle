# Releasing

Versions follow SemVer and are cut by
[release-please](https://github.com/googleapis/release-please) from the
Conventional Commits on `main`. The phases are in `roadmap.md` (Versioning).

## How it works

* `.github/workflows/release-please.yml` runs on every push to `main`. It
  keeps one release PR open, titled `chore(main): release X.Y.Z`, with the
  next version and the new `app/CHANGELOG.md` entries.
* Merging the release PR tags `vX.Y.Z` and creates the GitHub Release.
* `feat:` bumps the minor, `fix:` and `perf:` bump the patch. `docs:`,
  `chore:`, `ci:`, `build:`, `test:`, `refactor:` and `style:` don't trigger a
  release on their own.
* While the version is 0.x, `bump-minor-pre-major` makes a breaking change
  (`feat!:` or a `BREAKING CHANGE:` footer) bump the minor, not jump to 1.0.0.
* Only commits that touch `app/` count, because the release-please package is
  `app/`. Docs-only changes never produce a release.

Files:

* `release-please-config.json`: release settings.
* `.release-please-manifest.json`: the last released version. release-please
  updates it; don't edit it by hand.
* `app/package.json`: **the only source of the app version.** The release PR
  bumps it (and `package-lock.json`). `app/app.config.ts` reads it into the
  Expo config. iOS gets only `MAJOR.MINOR.PATCH`, because the App Store
  rejects pre-release labels, so `1.0.0-beta.2` ships as `1.0.0` there. The
  full version is in the tag, the GitHub Release and
  `Constants.expoConfig.version`.

## First release

The manifest starts empty and `initial-version` is `0.1.0`, so the first
release PR proposes 0.1.0. It opens once a releasable commit (`feat:` or
`fix:`, or any commit with a `Release-As: 0.1.0` footer) touching `app/`
reaches `main`. To force it without a feature, push an empty commit:

```bash
git commit --allow-empty -m "chore: release 0.1.0" -m "Release-As: 0.1.0"
```

## Repository setting

release-please opens PRs with the workflow's `GITHUB_TOKEN`. In
**Settings → Actions → General → Workflow permissions**, tick "Allow GitHub
Actions to create and approve pull requests", or the workflow fails.

PRs opened with `GITHUB_TOKEN` don't trigger other workflows, so CI does not
run on the release PR. That is fine: it only changes the version and the
CHANGELOG.

## Betas, release candidates and 1.0.0

Pre-release labels use a dot: `1.0.0-beta.1`, `1.0.0-beta.2` …

**Start betas (M5).** In `release-please-config.json`, add to the `app`
package:

```json
"versioning": "prerelease",
"prerelease": true,
"prerelease-type": "beta"
```

Then merge a commit whose body has the footer `Release-As: 1.0.0-beta.1`.
After that, each release PR bumps the beta number (`1.0.0-beta.2` …), and the
GitHub Releases are marked as pre-releases.

**Move to release candidates.** Change `prerelease-type` to `"rc"` and merge a
commit with `Release-As: 1.0.0-rc.1`.

**Cut 1.0.0.** Remove `versioning`, `prerelease` and `prerelease-type`, and
merge a commit with `Release-As: 1.0.0`.

`Release-As` must be in the commit that lands on `main`. With squash merges,
put it at the end of the squash commit's message when merging.
