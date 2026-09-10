# Asset Management SaaS

Production-ready starter scaffold for an asset management SaaS platform with a FastAPI backend, React + TypeScript frontend, PostgreSQL, and MinIO object storage.

## Stack

- **Backend:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, boto3
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, React Router, React Hook Form, Zod, Axios
- **Infrastructure:** Docker Compose, PostgreSQL, MinIO

## Quick start

1. Copy the environment template if you want to customize defaults:

   ```bash
   cp .env.example .env
   ```

2. Start the full local stack:

   ```bash
   docker-compose up --build
   ```

3. Open the apps:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- OpenAPI docs: http://localhost:8000/docs
- MinIO console: http://localhost:9001

## Project structure

```
backend/   FastAPI app, SQLAlchemy models, Alembic migrations, pytest tests
frontend/  React app with dashboard pages and API integration
```

## Backend notes

- API routes are namespaced under `/api/v1`.
- CRUD endpoints are included for:
  - Projects
  - People
  - Tasks
  - Deliverables
  - Asset Vaults
  - Assets
  - Asset Versions
- Asset uploads are stored in MinIO through the `/api/v1/assets/{asset_id}/upload` endpoint.
- Asset version files can be downloaded from `/api/v1/asset-versions/{version_id}/download`.
- Alembic is configured and the initial schema migration is included at `backend/alembic/versions/0001_initial.py`.

## Frontend notes

- Pages are included for Projects, People, Tasks, and Assets.
- The app uses TanStack Query for server state and React Hook Form + Zod for form validation.
- The UI is composed with Tailwind CSS and shadcn-style utility components.

## Development workflow

### Backend only

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend only

```bash
cd frontend
npm install
npm run dev
```

### Validation

```bash
cd backend && pytest
cd frontend && npm run build
docker-compose config
```

## Environment variables

### Root / Docker Compose

See `.env.example` for the defaults used by Docker Compose.

### Backend

Defined in `backend/.env.example`:

- `DATABASE_URL`
- `CORS_ORIGINS`
- `S3_ENDPOINT_URL`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_BUCKET_NAME`

### Frontend

Defined in `frontend/.env.example`:

- `VITE_API_BASE_URL`

## API documentation

FastAPI serves interactive Swagger UI documentation at `/docs` and ReDoc at `/redoc`.
