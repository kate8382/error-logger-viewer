## Contributing to Error Logger & Viewer

Thank you for your interest in contributing! This file describes the preferred workflow, code style, testing requirements and PR expectations.

1. Getting started
- Fork the repository and create a feature branch from `main` (use descriptive branch names, e.g. `feat/add-export` or `fix/header-i18n`).
- Keep changes focused and small. One logical change per PR.

2. Development workflow
- Install dependencies from repo root:

```powershell
npm ci
```

- Run tests locally before opening a PR:

```powershell
npm test
npm run test:frontend
npm run test:backend
```

- Run linters/TS checks:

```powershell
npm run lint:all
npm run ts:check
```

Note on TypeScript and project tsconfigs
- The repository contains per-folder tsconfig files and a base config:
	- `tsconfig.base.json` (root)
	- `frontend/tsconfig.json`
	- `backend/tsconfig.json`
	- `tests/e2e/tsconfig.json` (e2e/CI)
	- `tests/tsconfig.tests.json` (test runner configs)

- Use the provided scripts to run type checks in CI or locally:

```powershell
npm run ts:check       # runs TS checks for frontend + backend
npm run ts:check:unit  # runs unit TS checks
npm run ts:check:e2e   # runs TS checks for e2e tests
```

3. Tests and CI
- Add unit tests for new logic and update existing tests if behavior changes.
- E2E tests use Cypress; update fixtures under `tests/e2e/fixtures` when needed.
- PRs should pass CI: tests, build and e2e checks as configured in `.github/workflows/ci.yml`.

4. Pull requests
- Open a PR against `main` with a clear description and link to any related issues.
- Reference the testing steps you ran and any manual verification performed.
- Keep PRs small; if a change is large, split into multiple PRs.

5. Commit messages and style
- Commit messages:
    - Use clear, imperative commit messages. Optionally use Conventional Commits (e.g. `feat(...)`, `fix(...)`).
    - Follow existing code style; prefer consistent use of `camelCase` for identifiers and properties, and keep formatting consistent with Prettier settings.
- Code style — `createElement` usage:
We standardize calls to `createElement` in the frontend codebase to improve readability and type-safety.
    - Preferred style: use camelCase top-level fields for common attributes and `attrs` for less common or kebab-case attributes.
    - Examples: `className`, `id`, `tabIndex`, `dataI18n`, `ariaLabel`, `ariaHidden`, `text`, `disabled`.
    - For other attributes use `attrs: { 'data-foo': 'bar', 'aria-foo': 'baz' }`.
    - Rationale: camelCase top-level fields are easier to discover in TypeScript and are mapped by `createElement` to the correct HTML attributes (for example `dataI18n` → `data-i18n`, `ariaLabel` → `aria-label`).

6. Review process
- At least one approving review is required before merging.
- Address review comments with follow-up commits; avoid force-pushing over shared branches if not necessary.

7. Reporting issues and security
- Open GitHub issues for bugs and feature requests. For sensitive security issues, do not open a public issue—contact repository maintainers directly or use the security contact on GitHub.

8. License and copyright
- By contributing, you agree that your contributions will be licensed under the project's license (see [LICENSE](LICENSE)).

9. Code of Conduct
- Please be respectful in issues and PR discussions. If you want, we can add a project `CODE_OF_CONDUCT.md`—open an issue to propose one.
