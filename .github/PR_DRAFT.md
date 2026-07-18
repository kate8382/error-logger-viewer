# Dependency updates — draft PR log

This draft PR will collect incremental dependency updates applied in the `DEPENDENCY_UPDATES` branch.

---

## 1) Update: `esbuild` -> `0.28.1`

- **Why:** Security advisory GHSA-g7r4-m6w7-qqqr — fixes arbitrary file read when running the development server on Windows. The advisory affects versions >=0.27.3 and <0.28.1. Updating to `0.28.1` removes the vulnerability.
- **Change:** `npm install esbuild@0.28.1 --save-exact` (lockfile updated).
- **Testing plan:** run `npm ci`, `npm run test`, `npm run build:frontend`, `npm run build:backend`. Also verify Docker-based e2e in CI if enabled.
- **Expected risk level:** Low — this is a patch/minor security fix. Run unit tests and builds to confirm there are no regressions.
- **Result:** (pending — test/build output will be appended here after execution)

---

Further updates will be added as separate entries below, with explanation, test results and any required rollback instructions.
