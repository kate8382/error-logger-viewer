# Dependency updates — draft PR log

This draft PR will collect incremental dependency updates applied in the `DEPENDENCY_UPDATES` branch.

---

## 1) Update: `esbuild` -> `0.28.1`

- **Why:** Security advisory GHSA-g7r4-m6w7-qqqr — fixes arbitrary file read when running the development server on Windows. The advisory affects versions >=0.27.3 and <0.28.1. Updating to `0.28.1` removes the vulnerability.
- **Change:** `npm install esbuild@0.28.1 --save-exact` (lockfile updated).
- **Testing plan:** run `npm ci`, `npm run test`, `npm run build:frontend`, `npm run build:backend`. Also verify Docker-based e2e in CI if enabled.
- **Expected risk level:** Low — this is a patch/minor security fix. Run unit tests and builds to confirm there are no regressions.
- **Result:** (pending — test/build output will be appended here after execution)
 - **Result:**
	 - `npm ci` and `npm install esbuild@0.28.1 --save-exact` completed; `package-lock.json` updated and committed.
	 - Unit tests: frontend 8 suites, 34 tests passed; backend 2 suites, 4 tests passed.
	 - Builds: `build:frontend` and `build:backend` completed successfully (webpack compiled with warnings only).
	 - Vulnerabilities: `npm audit` shows remaining 5 moderate issues (reduced from 6); `esbuild` advisory resolved.
	 - Commit and push: changes committed and pushed to branch `DEPENDENCY_UPDATES` (latest local commit `f861e9b`).

---

Further updates will be added as separate entries below, with explanation, test results and any required rollback instructions.

---

## 2) Batch: minor/patch updates (`npm update`)

- **Why:** Apply safe minor/patch updates across dev and prod deps to reduce known advisories and keep the dependency tree up to date. This batch targets non‑breaking updates only.
- **Change:** ran `npm update`, then `npm ci` to refresh the lockfile. Created snapshots `outdated_after.json` and `audit_after.json` in the repo for review.
- **Notable package versions observed after update:** `jest` -> `30.4.2`, `jest-haste-map` -> `30.4.1`, `webpack` -> `5.108.4`, `cypress` -> `15.18.1`, `esbuild` remained at `0.28.1`.
- **Temporary workaround applied:** during tests `ts-jest` raised `Cannot find module 'jest-util'`. To unblock test runs we added `jest-util@30.4.1` as a dev dependency and committed the change. This is a short‑term workaround — we'll follow up by aligning `ts-jest`/`jest` versions properly and removing the workaround.
- **Testing performed:** ran `npm run test` (frontend + backend) and `npm run build:frontend` / `npm run build:backend` after the updates.
- **Result:**
	- `npm update` completed and `outdated_after.json` / `audit_after.json` created and committed.
	- Unit tests: frontend 8 suites, 34 tests passed; backend 2 suites, 4 tests passed.
	- Builds: `build:frontend` and `build:backend` completed; webpack compiled (warning: several asset size warnings only).
	- Vulnerabilities: reduced to 3 moderate issues after the batch and workaround (see `audit_after.json`).
	- Commits/pushes: batch changes committed and pushed to branch `DEPENDENCY_UPDATES` (commits include `d05ee8d`, `4496556`, `57b2c49` — see git log for exact sequence).

- **Next actions:**
	- Add a note/issue to remove the `jest-util` workaround after we either update `ts-jest` to a Jest 30 compatible release or otherwise reconcile versions.
	- Continue with targeted safe updates (e.g., `prettier`, `uuid`) one at a time, recording results here.

---

## 3) Update: `prettier` → 3.9.5

- **Why:** Safe minor/patch bump to keep formatting tooling current and reduce transitive advisory surface.
- **Command run:** `npm install --save-exact prettier@3.9.5` (lockfile updated).
- **Testing performed:** ran `npm run test`, `npm run build:frontend`, `npm run build:backend`.
- **Result:**
	- Unit tests: frontend 8 suites, 34 tests passed; backend 2 suites, 4 tests passed.
	- Builds: `build:frontend` completed; webpack 5 compiled with 2 warnings (asset size warnings). `build:backend` produced no output and exited successfully.
	- Vulnerabilities: overall audit state unchanged by this bump (see `audit_after.json` for current snapshot).
	- Commit: `package.json` and `package-lock.json` updated and committed to branch `DEPENDENCY_UPDATES`.

- **Notes:** `prettier` is a dev tooling dependency and should not affect runtime; warnings from webpack are pre-existing and unrelated to `prettier`.

---

## 4) Update: `uuid` → 14.0.1

- **Why:** Keep runtime utility `uuid` up to date to get bug fixes and minor performance/security improvements in UUID generation.
- **Command run:** `npm install --save-exact uuid@14.0.1` (lockfile updated).
- **Testing performed:** ran `npm run test`, `npm run build:frontend`, `npm run build:backend`.
- **Result:**
	- Unit tests: frontend 8 suites, 34 tests passed; backend 2 suites, 4 tests passed.
	- Builds: `build:frontend` completed; webpack 5 compiled with 2 warnings (asset size warnings). `build:backend` produced no output and exited successfully.
	- Vulnerabilities: no change attributable to this bump (see `audit_after.json`).
	- Commit: `package.json` and `package-lock.json` updated and will be committed to branch `DEPENDENCY_UPDATES`.

- **Notes:** `uuid` is used at runtime; tests covering areas that use UUID passed locally. If CI has integration/e2e tests that exercise UUID‑dependent behavior, watch for any failures and report back.

---

## 5) Rollback: `jest` and related packages -> 29.x (removed temporary `jest-util` workaround)

- **Why:** After a batch `npm update` the tree contained `jest@30.x` while `ts-jest` and some tooling expected the 29.x API. This caused runtime `Cannot find module 'jest-util'` errors. A temporary `jest-util@30.4.1` devDependency was added to unblock tests, but that is a brittle workaround we want to remove.
- **Change performed:** rolled back `jest`, `babel-jest`, `jest-environment-jsdom`, `jest-haste-map` to the latest 29.x releases (`29.7.0`) and removed the temporary `jest-util` dependency.
- **Commands run:**
	- `npm install --save-dev jest@29 babel-jest@29 jest-environment-jsdom@29 jest-haste-map@29`
	- `npm uninstall --save-dev jest-util`
- **Result:**
	- Local test suites (frontend + backend) pass: frontend 8 suites, 34 tests; backend 2 suites, 4 tests.
	- Builds succeed locally.
	- Project no longer contains `jest-util` temporary workaround; test infra is aligned with `ts-jest@29.x`.
- **Risk/Next steps:**
	- We should keep this rollback documented and, when the ecosystem stabilizes, plan a coordinated upgrade to Jest 30: update `ts-jest` and all `jest-*` plugins together in a separate major-change PR.
	- Create an issue to track upgrading to Jest 30 and removing the rollback once `ts-jest` compatibility is confirmed.

---

## 6) Cleanup: remove obsolete patches and temporary snapshots

- **Why:** The `patches/jest-haste-map+30.4.0.patch` was created for a 30.x release and is not compatible with the rolled-back `jest-haste-map@29.7.0`. Leaving an incompatible patch in `patches/` causes `patch-package` to fail during `postinstall` in CI. We removed the obsolete patch and the ancillary audit/outdated snapshots to simplify CI and avoid applying stale artifacts.
- **Files removed:** `patches/` (obsolete README and patch files), `audit.json`, `audit_after.json`, `outdated.json`, `outdated_after.json`.
- **Validation performed:**
  - Clean install: `rm -rf node_modules && npm ci` — `postinstall` runs `patch-package` and reports "No patch files found" (OK).
  - Local verification: `npm run test`, `npm run build:frontend`, `npm run build:backend` — all passed locally.

---

End of PR summary.



