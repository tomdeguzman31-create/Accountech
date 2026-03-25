<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/47bb4d86-fb8d-4a92-8c39-5aded3d2e097

## Run Locally

**Prerequisites:**  Node.js

Project structure now uses separate folders:

- `backend/` for API server
- `frontend/` for Vite React app

You can run the frontend from `frontend/` or from repo root.


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

From repo root:

- Frontend only: `npm run dev:frontend`
- Backend only: `npm run dev:backend`
- Both together: `npm run dev`
