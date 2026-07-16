This folder contains patch files created by `patch-package`.

Purpose
- Some npm packages require small fixes or workarounds that are not yet published upstream. The `patches/` directory stores those changes as unified diffs (patch files) which are applied to `node_modules` after `npm install` via the `postinstall` script.

How it works
- `patch-package` reads the patch files in this folder and applies them to the installed packages during `npm install` (triggered by the `postinstall` script).

When to add a patch
1. Reproduce the problem locally by installing dependencies and modifying `node_modules/<package>` to fix the issue.
2. Run `npx patch-package <package-name>` to generate a patch file in `patches/`.
3. Commit the generated patch file to the repository.

Best practices
- Keep patches as small and well-documented as possible.
- Include a short comment at the top of the patch file (in this README) explaining why the patch exists and which versions it targets.
- Avoid patching large or frequently changing packages when possible — prefer contributing fixes upstream.

Notes for Docker and CI
- Production images in this repository now skip lifecycle scripts (`npm ci --omit=dev --ignore-scripts`) to avoid running `postinstall` in the production build. This is intentional: patches are typically only needed when devDependencies are installed (e.g. during CI or local development).
- Ensure CI jobs or test-stage Docker builds that require patches install devDependencies (or run `patch-package` explicitly) so patches are applied.

Commands
- Generate a patch after editing installed package files:
```bash
npx patch-package <package-name>
```
- Apply patches manually (if needed):
```bash
npx patch-package
```

Current patches in this repository
---------------------------------
- `jest-haste-map+30.4.0.patch` — patch applied to `jest-haste-map` to address Windows-specific behavior when running Jest/watchman on some environments. This patch is required so tests and jest-related tooling behave correctly on CI and certain developer machines.

**Node:** Keep this README updated with the rationale for each patch file present in this folder.


