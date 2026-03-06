# Federation Protocol — Open Learn Grid

## Overview

Open Learn Grid instances communicate using a lightweight activity-based federation protocol. Each instance exposes a well-known endpoint, an inbox for receiving activities, and can proactively broadcast activities to trusted instances.

Activities are signed with RSA-2048 + SHA-256, giving each instance a verifiable identity. Instances store a public key that other instances use to verify received payloads.

---

## Discovery

Every instance exposes its metadata at:

```
GET /.well-known/openlearngrid/instance
```

### Response

```json
{
  "domain": "learngrid.example.edu",
  "name": "Example University Learn Grid",
  "description": "Academic resource sharing for Example University.",
  "version": "1.0",
  "public_key": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "material_count": 1423,
  "user_count": 512,
  "registration_open": true,
  "requires_approval": false,
  "admin_email": "admin@example.edu",
  "logo_url": null,
  "is_active": true
}
```

---

## Activity Format

All activities follow this schema:

```json
{
  "id": "<uuid>",
  "type": "<ActivityType>",
  "actor": "https://<sender-domain>",
  "object": { ... },
  "published": "2025-01-01T00:00:00Z"
}
```

### Activity Types

| Type | Description |
|------|-------------|
| `material_shared` | A material is being federated to other instances |
| `material_updated` | A previously shared material has been updated |
| `material_removed` | A previously shared material has been removed |
| `instance_hello` | Initial handshake from a new instance (reserved) |
| `instance_bye` | Instance announcing it is leaving the federation (reserved) |
| `instance_stats` | Periodic stats broadcast (material count, user count) |

---

## Inbox Endpoint

Instances accept activities at:

```
POST /api/federation/inbox/
Content-Type: application/json
X-Activity-Signature: <base64-rsa-sha256-signature>
X-Instance-Domain: <sender-domain>
```

The inbox validates the signature, deduplicates by `activity_id`, and queues the activity for async processing. It returns **202 Accepted** immediately.

### Error Responses

| Code | Meaning |
|------|---------|
| 400 | Malformed payload or missing required fields |
| 401 | Signature verification failed |
| 403 | Sending instance is blocked |
| 409 | Duplicate `activity_id` (idempotent ignore) |

---

## Request Signing

### Signature Algorithm

1. Serialize the activity payload to compact JSON:
   ```python
   body = json.dumps(payload, separators=(",", ":"), sort_keys=True)
   ```
2. Compute SHA-256 digest of the bytes.
3. Sign the digest with the sender's RSA-2048 private key using PKCS#1v15 + SHA-256.
4. Base64-encode the resulting signature.
5. Set the `X-Activity-Signature` header to this value.

### Signature Verification

The receiving instance:
1. Looks up the sender instance by `actor` domain.
2. Fetches the sender's public key from its local database (or re-fetches from `/.well-known/openlearngrid/instance`).
3. Re-serializes the received payload with the same compact JSON settings.
4. Verifies the signature with `X-Activity-Signature` against the sender's public key.

### Anti-Replay

Activities are rejected if their `published` timestamp is more than **300 seconds** (5 minutes) in the past or future.

---

## `material_shared` Activity

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "material_shared",
  "actor": "https://source.example.edu",
  "object": {
    "type": "Material",
    "id": "42",
    "title": "Thermodynamics Lecture Notes",
    "description": "Complete notes for PHYS 301",
    "material_type": "Lecture Notes",
    "subject": "Thermodynamics",
    "department": "Physics",
    "semester": 5,
    "tags": ["thermodynamics", "lecture", "physics"],
    "file_url": "https://source.example.edu/media/materials/thermo_notes.pdf",
    "external_url": "https://source.example.edu/materials/42",
    "uploaded_by": "prof_smith",
    "verification_status": "verified",
    "view_count": 412,
    "download_count": 203,
    "created_at": "2025-01-10T09:00:00Z"
  },
  "published": "2025-01-10T09:01:00Z"
}
```

---

## Trust Levels

Instances are assigned one of three trust levels when added to the federation:

| Level | Behavior |
|-------|---------|
| `trusted` | Activities are accepted and materials appear in federated browse |
| `neutral` | Activities are accepted but materials are not surfaced by default |
| `blocked` | All activities are rejected with HTTP 403 |

---

## Instance States

- **Reachable**: Instance responded successfully to the last health check.
- **Unreachable**: Last health check failed; activities to this instance are skipped until it recovers.
- `health_check_instances` Celery beat task runs every 15 minutes and updates `is_reachable`.

---

## Celery Tasks

| Task | Trigger | Description |
|------|---------|-------------|
| `process_federated_activity` | Inbox receipt | Dispatches activity by type |
| `send_activity_to_instance` | Share/update/remove | Sends single HTTP POST to inbox |
| `broadcast_activity` | Any material change | Sends to all trusted reachable instances |
| `health_check_instances` | Celery beat, every 15 min | Pings `/.well-known/` of all non-blocked instances |
| `send_instance_stats` | Celery beat, every 6 h | Broadcasts `instance_stats` activity |
| `sync_instance_materials` | Manual / button | Full re-sync of materials from one instance |
| `cleanup_old_activities` | Celery beat, daily | Deletes processed activities older than 90 days |
