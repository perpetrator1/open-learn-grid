// ============================================================
// Core domain types matching Django API responses
// ============================================================

export interface UserPublic {
  id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  instance_origin: string;
}

export interface UserProfile extends UserPublic {
  email: string;
  bio: string;
  is_verified_email: boolean;
  is_2fa_enabled: boolean;
  date_joined: string;
  last_login: string | null;
  permissions: string[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  is_system_role: boolean;
  permissions: string[];
  created_by: UserPublic | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: number;
  user: UserPublic;
  role: Role;
  assigned_by: UserPublic | null;
  assigned_at: string;
  scope: "instance-wide" | "department-level";
  department: number | null;
}

export type RoleRequestStatus = "pending" | "approved" | "rejected";

export interface RoleRequest {
  id: number;
  user: UserPublic;
  requested_role: Role;
  status: RoleRequestStatus;
  justification: string;
  reviewed_by: UserPublic | null;
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
}

// ============================================================
// Auth request/response payloads
// ============================================================

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  display_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  totp_code?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: UserProfile;
}

export interface TokenRefreshResponse {
  access: string;
}

export interface PasswordChangePayload {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface PasswordResetRequestPayload {
  email: string;
}

export interface PasswordResetConfirmPayload {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

// ============================================================
// 2FA payloads
// ============================================================

export interface TOTPSetupResponse {
  totp_uri: string;
  secret: string;
  qr_code: string; // base64 PNG
}

export interface TOTPVerifyPayload {
  code: string;
}

export interface TOTPDisablePayload {
  password: string;
  code: string;
}

// ============================================================
// Role management payloads
// ============================================================

export interface RoleWritePayload {
  name: string;
  description?: string;
  permissions: string[];
}

export interface AssignRolePayload {
  user_id: number;
  role_id: number;
  scope?: "instance-wide" | "department-level";
  department?: number | null;
}

export interface RoleRequestCreatePayload {
  requested_role_id: number;
  justification: string;
}

export interface RoleRequestReviewPayload {
  status: "approved" | "rejected";
  review_note?: string;
}

// ============================================================
// Pagination
// ============================================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================
// Generic API error
// ============================================================

export interface ApiError {
  detail?: string;
  [field: string]: string | string[] | undefined;
}
