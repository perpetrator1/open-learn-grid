# API Reference

Open Learn Grid exposes a REST API with JWT authentication.

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

### Get Tokens

```http
POST /api/token/
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

Response:

```json
{
  "access": "<jwt_access_token>",
  "refresh": "<jwt_refresh_token>"
}
```

### Refresh Token

```http
POST /api/token/refresh/
Content-Type: application/json

{ "refresh": "<jwt_refresh_token>" }
```

---

## Health & Status

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health/` | None | Full component health check |
| `GET` | `/api/readiness/` | None | k8s readiness probe (DB only) |
| `GET` | `/api/liveness/` | None | k8s liveness probe |

---

## Accounts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/accounts/register/` | None | Register new user |
| `POST` | `/api/accounts/login/` | None | Login |
| `POST` | `/api/accounts/logout/` | Required | Logout (blacklist refresh token) |
| `GET` | `/api/accounts/me/` | Required | Get current user profile |
| `PATCH` | `/api/accounts/me/` | Required | Update profile |
| `POST` | `/api/accounts/change-password/` | Required | Change password |
| `POST` | `/api/accounts/forgot-password/` | None | Request password reset email |
| `POST` | `/api/accounts/reset-password/{token}/` | None | Complete password reset |
| `GET` | `/api/accounts/users/` | Admin | List all users |
| `GET` | `/api/accounts/roles/` | Required | List available roles |
| `POST` | `/api/accounts/role-requests/` | Required | Request a role |

---

## Materials

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/materials/` | None | Browse materials (paginated) |
| `POST` | `/api/materials/` | Required | Upload material |
| `GET` | `/api/materials/{id}/` | None | Get material detail |
| `PATCH` | `/api/materials/{id}/` | Owner/Admin | Update material |
| `DELETE` | `/api/materials/{id}/` | Owner/Admin | Delete material |
| `GET` | `/api/materials/types/` | None | List material types |
| `GET` | `/api/materials/tags/` | None | List tags |
| `POST` | `/api/verification/queue/` | Verifier | Get verification queue |
| `POST` | `/api/materials/{id}/verify/` | Verifier | Approve material |
| `POST` | `/api/materials/{id}/reject/` | Verifier | Reject material |

**Query Parameters for `GET /api/materials/`:**

| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Full-text search |
| `department` | int | Filter by department ID |
| `subject` | int | Filter by subject ID |
| `material_type` | int | Filter by type ID |
| `verification_status` | string | `verified`, `pending`, `rejected` |
| `ordering` | string | `-created_at`, `view_count`, `-download_count` |
| `page` | int | Page number (20 items/page) |

---

## Academic Structure

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/academic/departments/` | List departments |
| `GET` | `/api/academic/courses/` | List courses (filter by `department`) |
| `GET` | `/api/academic/semesters/` | List semesters |
| `GET` | `/api/academic/subjects/` | List subjects |
| `POST` | `/api/academic/departments/` | Create department (Admin) |

---

## Federation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/federation/instances/` | Admin | List federated instances |
| `POST` | `/api/federation/instances/` | Admin | Add instance |
| `POST` | `/api/federation/instances/{id}/trust/` | Admin | Set trust level |
| `POST` | `/api/federation/instances/{id}/sync/` | Admin | Trigger sync |
| `GET` | `/api/federation/materials/` | None | Browse federated materials |
| `GET` | `/api/federation/activities/` | Admin | View activity log |
| `POST` | `/api/federation/inbox/` | None (signed) | Receive activity |
| `GET` | `/api/federation/health/` | None | Federation health |
| `GET` | `/api/federation/metrics/` | Admin | Federation metrics |
| `POST` | `/api/federation/share-material/{id}/` | Teacher/Admin | Share material |
| `POST` | `/api/federation/generate-keys/` | None | Generate RSA key pair |
| `GET` | `/.well-known/openlearngrid/instance` | None | Instance discovery |

---

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/notifications/` | List notifications |
| `POST` | `/api/notifications/{id}/read/` | Mark as read |
| `POST` | `/api/notifications/read-all/` | Mark all as read |
| `GET` | `/api/notifications/preferences/` | Get notification preferences |
| `PATCH` | `/api/notifications/preferences/` | Update preferences |

**WebSocket:** Connect to `ws://<host>/ws/notifications/?token=<access_token>` for real-time notifications.

---

## Moderation

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/moderation/reports/` | Moderator | List reports |
| `POST` | `/api/moderation/reports/` | Required | Submit a report |
| `POST` | `/api/moderation/reports/{id}/resolve/` | Moderator | Resolve report |
| `GET` | `/api/moderation/bans/` | Moderator | List bans |
| `POST` | `/api/moderation/ban/` | Moderator | Ban a user |

---

## Dashboard

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard/student/` | Student dashboard stats |
| `GET` | `/api/dashboard/teacher/` | Teacher dashboard stats |
| `GET` | `/api/dashboard/admin/` | Admin dashboard stats |

---

## Pagination

All list endpoints return paginated responses:

```json
{
  "count": 142,
  "next": "https://example.com/api/materials/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

---

## Error Responses

```json
{
  "detail": "Human-readable error message."
}
```

Common HTTP status codes:

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Authentication required |
| 403 | Permission denied |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate activity ID) |
| 422 | Unprocessable entity |
| 500 | Internal server error |
| 503 | Service unavailable (health check) |
