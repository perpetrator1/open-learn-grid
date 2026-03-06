# Testing Guide

## Backend Tests (pytest)

### Setup

```bash
cd backend
pip install -r requirements-dev.txt   # includes pytest, factory-boy, coverage
```

### Run Tests

```bash
# All tests
pytest

# With verbose output
pytest -v

# Specific app
pytest accounts/ -v
pytest federation/ -v

# Specific test file
pytest materials/tests/test_upload.py -v

# Run with coverage report
pytest --cov=. --cov-report=html --cov-report=term-missing

# Open HTML coverage report
open htmlcov/index.html
```

### Test Settings

Tests use `config.settings.test` which:
- Uses an in-memory SQLite database (fast)
- Disables Celery tasks (tasks stay synchronous or are mocked)
- Uses dummy email backend
- Disables S3 (local media storage)

### Writing Tests

```python
# materials/tests/test_upload.py
import pytest
from rest_framework.test import APIClient
from accounts.tests.factories import UserFactory
from materials.tests.factories import MaterialFactory

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def authenticated_client(api_client):
    user = UserFactory()
    api_client.force_authenticate(user=user)
    return api_client, user

@pytest.mark.django_db
def test_upload_material(authenticated_client):
    client, user = authenticated_client
    # ... test body
```

### Test Structure

```
<app>/
└── tests/
    ├── __init__.py
    ├── factories.py          # Factory Boy factories
    ├── test_models.py        # Model unit tests
    ├── test_views.py         # API endpoint tests
    └── test_<feature>.py     # Feature-specific tests
```

---

## Frontend Tests (vitest + React Testing Library)

### Run Tests

```bash
cd frontend

# Run all tests once
npm test -- --run

# Watch mode
npm test

# With coverage
npm test -- --run --coverage
```

### Writing Component Tests

```tsx
// components/materials/MaterialCard.test.tsx
import { render, screen } from '@testing-library/react'
import { MaterialCard } from './MaterialCard'
import { mockMaterial } from '@/test/fixtures'

describe('MaterialCard', () => {
  it('renders title and type', () => {
    render(<MaterialCard material={mockMaterial} layout="grid" />)
    expect(screen.getByText(mockMaterial.title)).toBeInTheDocument()
    expect(screen.getByText(mockMaterial.material_type.name)).toBeInTheDocument()
  })
})
```

### Testing API Interactions

Use `msw` (Mock Service Worker) to mock API calls in tests:

```tsx
import { rest } from 'msw'
import { server } from '@/test/server'

beforeEach(() => {
  server.use(
    rest.get('/api/materials/', (req, res, ctx) =>
      res(ctx.json({ count: 1, results: [mockMaterial] }))
    )
  )
})
```

---

## E2E Tests (Playwright)

### Setup

```bash
cd frontend
npx playwright install --with-deps chromium
```

### Run E2E Tests

```bash
# All tests
npx playwright test

# Specific test file
npx playwright test tests/e2e/auth.spec.ts

# Headed mode (see browser)
npx playwright test --headed

# UI mode
npx playwright test --ui
```

### E2E Test Structure

```
frontend/tests/e2e/
├── auth.spec.ts          # Register, login, logout
├── materials.spec.ts     # Browse, upload, verify
├── federation.spec.ts    # Connect instances
└── admin.spec.ts         # Role management
```

---

## CI Configuration

Tests run automatically on every PR via GitHub Actions (`.github/workflows/test.yml`):

1. **Backend:** `pytest --cov --cov-fail-under=80`
2. **Frontend:** `npm test -- --run`  
3. **TypeScript:** `tsc --noEmit`
4. **Lint:** `ruff check . && npm run lint`

PRs must pass all checks before merging.
