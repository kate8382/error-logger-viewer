 # Frontend — Error Logger & Viewer

 This README contains detailed instructions to run, build and test the frontend.

 ## Prerequisites
 - Node.js (16+) and npm

 ## Quick start (dev)
 ```powershell
 cd frontend
 npm install
 npm run dev
 # open http://localhost:8080
 ```

 ## Available scripts (from package.json)
 - `npm run dev` — development server (webpack)
 - `npm run build` — production build
 - `npm run serve:dist` — serve the built `dist` folder locally
 - `npm test` — run Jest unit tests
 - `npx cypress open` / `npx cypress run` — Cypress e2e (see Tests below)

 ## Build & preview production
 ```powershell
 cd frontend
 npm install
 npm run build
 npm run serve:dist
 # open http://localhost:8080
 ```

 ## Tests
 ### Unit tests (Jest)
 ```powershell
 cd frontend
 npm test
 ```

 ### End-to-end tests (Cypress)
 Start dev server in one terminal:
 ```powershell
 cd frontend
 npm run dev
 ```
 Open Cypress (interactive):
 ```powershell
 npx cypress open --config baseUrl="http://localhost:8080"
 ```
 Or run headless:
 ```powershell
 npx cypress run --config baseUrl="http://localhost:8080"
 ```

 ## Troubleshooting
 - If Cypress cannot find the app: ensure dev server is running and `baseUrl` matches.
 - If `serve:dist` uses a conflicting port, change the port or stop other servers.

 ## Notes
 - Make sure `homepage` in `package.json` points to the GitHub Pages URL if publishing a demo.
 - See `frontend/TESTS.md` for more detailed test examples and helper commands.
