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
