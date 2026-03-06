# Federation Guide

## Overview

Open Learn Grid supports federated material sharing between independently-hosted instances. Using a signed activity protocol, your instance can share verified academic resources with trusted peers without centralised control.

Federation is **opt-in** at every level:
- Admins choose which instances to trust
- Teachers choose which materials to share
- Users can request their uploads not be federated

---

## Connecting to Another Instance

1. Log in as an admin
2. Go to the **Federation** page in the nav bar (admin role required)
3. Click **Add Instance** and enter the domain (e.g., `learngrid.otheruni.edu`)
4. Click **Fetch Info** — the instance metadata will be retrieved from `/.well-known/openlearngrid/instance`
5. Review the instance name, description, public key fingerprint, and material count
6. Set the trust level and click **Add Instance**

The new instance starts with trust level **Neutral** by default.

---

## Trust Levels

### Trusted

- Activities (material shares, updates, removals) are accepted and processed automatically
- Materials from this instance appear in the **Federated Network** browse tab for all users
- Instance stats broadcasts are received and stored

### Neutral

- Activities are accepted and queued, but materials do not appear publicly until an admin approves them
- Use this for new instances you haven't fully vetted

### Blocked

- All incoming activities from this instance are rejected with HTTP 403
- Previously federated materials from this instance are hidden
- The instance's domain is added to an internal block list

---

## What Data is Shared

When a teacher or admin marks a material as **Share to Federation**, the following is broadcast to all trusted instances:

**Shared:**
- Material title, description, material type
- Subject name, department name, semester number
- Tags list
- File URL (publicly accessible on your instance)
- External URL (link back to source)
- Uploader's username (no email or personal data)
- Verification status and creation timestamp

**Never shared:**
- User email addresses, passwords, IP addresses
- Private messages, internal comments, or admin notes
- Unverified or rejected materials (unless explicitly shared by admin)
- User ban lists or moderation records

---

## Receiving Materials

Materials from **trusted** instances appear automatically in the **Federated Network** tab on the Browse page. Users can filter by source instance.

Materials from **neutral** instances are held until an admin reviews and approves them.

---

## Sharing Materials

1. Open the material detail page for any verified material you own (or any material if you're an admin/teacher)
2. Click **Share to Federation** in the actions menu
3. The material is broadcast as a `material_shared` activity to all trusted, reachable instances
4. Recipients process the activity asynchronously — materials appear within a few seconds

To stop sharing: click **Remove from Federation** — a `material_removed` activity is sent and the material is hidden on all instances.

---

## Security Model

- **RSA-2048 signing**: all activities include an `X-Activity-Signature` header (base64 RSA-SHA256 signature of the compact JSON body)
- **Replay prevention**: activities with timestamps more than 5 minutes old or in the future are rejected
- **Key verification**: each instance stores the remote instance's public key; signature is verified on receipt
- **Deduplication**: each activity has a unique UUID (`activity_id`); duplicate activities are silently dropped

---

## Health Checks

Open Learn Grid automatically health-checks all non-blocked instances every 15 minutes. Instances that fail three consecutive checks are marked **unreachable** and skipped for outbound activities until they recover.

---

## Privacy Controls

Users can opt their materials out of federation in their profile settings (if the feature is enabled). Admins can configure instance-wide defaults in the Django admin under **Federation → Instances**.
