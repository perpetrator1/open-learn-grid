# Contributing to Open Learn Grid

Thank you for your interest in contributing! This guide describes how to set up your development environment and submit high-quality contributions.

---

## Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourorg/open-learn-grid.git
   cd open-learn-grid
   ```

2. **Start local dev stack:**
   ```bash
   cp .env.example .env    # set DEBUG=True, local DB, etc.
   make dev
   ```

   Or run backend and frontend separately:

   ```bash
   # Terminal 1 — backend
   cd backend
   python -m venv .venv && source .venv/bin/activate
   pip install -r requirements.txt -r requirements-dev.txt
   python manage.py migrate
   python manage.py create_sample_data
   python manage.py runserver

   # Terminal 2 — frontend
   cd frontend
   npm install
   npm run dev
   ```

3. **Verify everything works:**
   ```bash
   make test        # backend pytest + frontend vitest
   make typecheck   # TypeScript strict check
   make lint        # ruff + eslint
   ```

---

## Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-desc>` | `feat/federation-inbox` |
| Bug fix | `fix/<short-desc>` | `fix/jwt-refresh-loop` |
| Docs | `docs/<topic>` | `docs/api-reference` |
| Refactor | `refactor/<scope>` | `refactor/material-serializer` |
| Chore | `chore/<task>` | `chore/upgrade-django` |

---

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): short description

[optional body]

[optional footer: references]
```

Examples:
```
feat(federation): add instance health-check task
fix(auth): handle expired refresh token gracefully
docs(api): document federation inbox endpoint
test(materials): add upload size limit tests
```

---

## Code Style

**Backend (Python):**
- Format with `ruff format .`
- Lint with `ruff check .`
- Follow Django conventions: class-based views, DRF serializers, model methods
- Write docstrings for all public functions and model methods
- Always use `select_related` / `prefetch_related` in serializers to avoid N+1

**Frontend (TypeScript/React):**
- Format with `prettier`
- Lint with `eslint`
- Prefer functional components and hooks
- Colocate types with their feature; export shared types from `src/types/index.ts`
- Use TanStack Query for all server state; Zustand only for client-side UI state
- Never use `any` — prefer `unknown` and type guards

---

## Writing Tests

**Backend:**
- All new features must include pytest tests
- Place tests in `<app>/tests/test_<file>.py`
- Use `factory_boy` factories (see existing `factories.py` files)
- Aim for ≥80% coverage on new code
- Test happy path + error cases + permission boundaries

**Frontend:**
- Use React Testing Library for component tests
- Use vitest for unit tests
- Test: renders correctly, user interactions, loading/error states

---

## Pull Request Checklist

Before submitting a PR:

- [ ] `make test` passes
- [ ] `make lint` passes with no errors
- [ ] `make typecheck` passes (zero TypeScript errors)
- [ ] New migrations are included if models changed
- [ ] Docs updated if the API or configuration changed
- [ ] PR description explains the why, not just the what
- [ ] Screenshots included for UI changes

---

## Security Issues

Please **do not** open a public issue for security vulnerabilities. Instead, email `security@yourdomain.com` with a description and reproduction steps. We will respond within 48 hours.

---

## Code of Conduct

We expect all contributors to treat each other with respect. Harassment, discrimination, and disrespectful language are not tolerated. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.
