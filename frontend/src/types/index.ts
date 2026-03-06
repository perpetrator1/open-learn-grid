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

// ============================================================
// Academic types
// ============================================================

export interface Department {
  id: number;
  name: string;
  code: string;
  description: string;
  logo: string | null;
  is_active: boolean;
  course_count: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: number;
  name: string;
  code: string;
  department: Department;
  duration_years: number;
  description: string;
  is_active: boolean;
  semester_count: number;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: number;
  number: number;
  academic_year: string;
  course: Course;
  is_active: boolean;
  subject_count: number;
  created_at: string;
}

export interface SubjectMapping {
  id: number;
  semester: Semester;
  department: Department | null;
  is_active: boolean;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  is_common: boolean;
  credit_hours: number;
  is_active: boolean;
  mappings: SubjectMapping[];
  created_at: string;
  updated_at: string;
}

export type AcademicRequestType =
  | "add_department"
  | "add_course"
  | "add_subject"
  | "add_semester";

export type AcademicRequestStatus = "pending" | "approved" | "rejected";

export interface AcademicRequest {
  id: number;
  requester: UserPublic;
  request_type: AcademicRequestType;
  payload: Record<string, unknown>;
  status: AcademicRequestStatus;
  reviewed_by: UserPublic | null;
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
}

// ============================================================
// Materials types
// ============================================================

export type VerificationStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "revision_requested";

export interface MaterialType {
  id: number;
  name: string;
  icon: string;
  is_active: boolean;
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
}

export interface Material {
  id: number;
  title: string;
  description: string;
  material_type: MaterialType;
  subject: Subject;
  semester: Semester | null;
  department: Department | null;
  course: Course | null;
  file: string | null;
  external_url: string | null;
  tags: Tag[];
  uploaded_by: UserPublic;
  verified_by: UserPublic | null;
  verification_status: VerificationStatus;
  verification_note: string | null;
  upload_source_instance: string | null;
  view_count: number;
  download_count: number;
  is_archived: boolean;
  is_federated_shared: boolean;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
}

export interface MaterialVersion {
  id: number;
  version_number: number;
  file: string;
  change_note: string;
  uploaded_by: UserPublic;
  created_at: string;
}

export type MaterialRequestType = "add" | "remove" | "update";
export type MaterialRequestStatus = "pending" | "approved" | "rejected";

export interface MaterialRequest {
  id: number;
  requester: UserPublic;
  request_type: MaterialRequestType;
  material: Material | null;
  proposed_data: Record<string, unknown>;
  status: MaterialRequestStatus;
  reviewed_by: UserPublic | null;
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
}

// ============================================================
// Write payloads
// ============================================================

export interface MaterialWritePayload {
  title: string;
  description?: string;
  material_type: number;
  subject: number;
  semester?: number | null;
  department?: number | null;
  course?: number | null;
  file?: File;
  external_url?: string;
  tags?: string[];
  is_federated_shared?: boolean;
}

export interface AcademicRequestCreatePayload {
  request_type: AcademicRequestType;
  payload: Record<string, unknown>;
}

export interface MaterialFilters {
  department?: number;
  course?: number;
  semester?: number;
  subject?: number;
  material_type?: number;
  verification_status?: VerificationStatus;
  tags?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  ordering?: string;
  page?: number;
}
