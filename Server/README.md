# MindCare Server

Express + TypeScript backend for MindCare.

## Recommended Node version

**Node 20 LTS** is recommended for local development.  
Node 22 has known issues with experimental ESM loader approaches for TypeScript (e.g. `ts-node` run-time compilation) that cause cryptic crashes before app code even starts.

The build-first workflow below works on both Node 20 and Node 22 because `tsc` compiles TypeScript to plain JavaScript first, and `node` then runs the compiled output directly — no experimental loaders involved.

## Local development

### 1. Install dependencies

```bash
cd Server
npm install
```

### 2. Create a `.env` file

Copy the example (or create `Server/.env`) with at minimum:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=http://localhost:5173
ML_API_URL=https://atharva-mohite-ce-ai-mental-health-api.hf.space
PORT=5000
```

> **Never commit `.env` – it is already in `.gitignore`.**

### 3. Run the dev server

```bash
npm run dev
```

This command:
1. Runs `tsc` to compile `src/` → `dist/`
2. Starts `node dist/server.js`
3. On any `.ts` file change under `src/`, nodemon repeats steps 1–2 automatically

### Other scripts

| Script | What it does |
|--------|-------------|
| `npm run build` | Compile TypeScript (`src/` → `dist/`) |
| `npm start` | Run the compiled server (`node dist/server.js`) – used by Render |
| `npm run dev` | Build + run with file-watching via nodemon |

## Production (Render)

Render uses `npm run build` as the build command and `npm start` (i.e. `node dist/server.js`) as the start command.  
Make sure the following environment variables are set in the Render dashboard:

- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_ORIGIN`
- `ML_API_URL`
- `PORT` (Render sets this automatically)
