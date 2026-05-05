Security review notes

- Finding: historical API key found in repo (noted in PR review). Current `backend/db.json` contains placeholder `replace-with-runtime-generated-api-key`.
- Action items before merging `fix/dev-server-startup`:
  1. Ensure no real secrets remain in tracked files. Run:
     - `git grep -nE "PASSWORD|DB_PASS|SECRET|TOKEN|API_KEY|AWS_|PRIVATE_KEY|SSH_PRIVATE_KEY|PRIVATE_KEY|GITHUB_TOKEN|x-access-token"`
  2. If any secrets are found, rotate them immediately and remove from repo. Consider using `git filter-repo` or `bfg` to scrub history.
  3. Replace any real keys in example files with placeholders and keep secrets in environment variables or secret management.
  4. Add `backend/db.json` to `.gitignore` if it should be runtime-only, and provide `backend/db.example.json` with sample data.

Recommended next steps (can be executed in branch `fix/dev-server-startup`):
- Create `backend/db.example.json` with non-sensitive demo content and commit.
- Replace tracked `backend/db.json` with a placeholder or remove and instruct to create locally from example.
- Prepare PR describing the rotation steps and ask admin to rotate keys used in production.
