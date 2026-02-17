# Open Learn Grid

Open Learn Grid is a monorepo with a React frontend and a Django REST backend.

## Project structure

- frontend/: Vite + React + TypeScript with Tailwind CSS, shadcn/ui, React Router, TanStack Query, and Zustand
- backend/: Django 5 + Django REST Framework + SimpleJWT with Postgres
- docker-compose.yml: local dev stack for Postgres, Redis, backend, and frontend

## Local development

Frontend:
- cd frontend
- npm install
- npm run dev

Backend:
- cd backend
- ./.venv/bin/python -m pip install -r requirements.txt
- ./.venv/bin/python manage.py migrate
- ./.venv/bin/python manage.py runserver

Docker:
- docker compose up --build

## API endpoints

- /api/health/
- /api/token/
- /api/token/refresh/
