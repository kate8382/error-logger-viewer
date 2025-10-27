 # Backend — Error Logger & Viewer (Node.js + LowDB)

 This README contains instructions to run the simple backend used by the app.

 ## Prerequisites
 - Node.js (16+) and npm

 ## Quick start
 ```powershell
 cd backend
 npm install
 npm start
 # backend listens by default on http://localhost:3000
 ```

 ## Development
 ```powershell
 cd backend
 npm install
 npm run dev   # uses nodemon if available
 ```

 ## API
 - `GET /errors`
 - `POST /errors`
 - `PUT /errors/:id`
 - `DELETE /errors/:id`

 ## Notes
 - Data is stored in `backend/db.json` (LowDB). For production, replace with a persistent DB.
