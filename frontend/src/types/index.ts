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

// ============================================================
// Moderation
// ============================================================

export type ReportItemType = "material" | "user" | "instance";
export type ReportReason =
  | "inappropriate_content"
  | "copyright_violation"
  | "spam"
  | "harassment"
  | "incorrect_info"
  | "other";
export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";
export type BanScope = "instance_wide" | "department_level" | "subject_level";
export type AppealStatus = "pending" | "approved" | "rejected";

export interface Report {
  id: number;
  reporter: UserPublic | null;
  reported_item_type: ReportItemType;
  material: number | null;
  reported_user: number | null;
  reason: ReportReason;
  description: string;
  evidence_urls: string[];
  context: string;
  status: ReportStatus;
  assigned_to: UserPublic | null;
  action_taken: string;
  resolved_by: UserPublic | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ban {
  id: number;
  user: UserPublic;
  banned_by: UserPublic | null;
  scope: BanScope;
  department: number | null;
  subject: number | null;
  reason: string;
  duration: string;
  expires_at: string | null;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
  lifted_at: string | null;
  lifted_by: UserPublic | null;
}

export interface Appeal {
  id: number;
  ban: number;
  appellant: UserPublic;
  reason: string;
  supporting_evidence: string;
  status: AppealStatus;
  reviewed_by: UserPublic | null;
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
}

// ============================================================
// Notifications
// ============================================================

export type NotificationType =
  | "role_assigned"
  | "role_removed"
  | "material_verified"
  | "material_rejected"
  | "material_request_approved"
  | "material_request_rejected"
  | "academic_request_approved"
  | "academic_request_rejected"
  | "report_filed"
  | "report_resolved"
  | "ban_issued"
  | "ban_lifted"
  | "new_material_in_subject"
  | "mention"
  | "system_announcement";

export interface Notification {
  id: number;
  recipient: number;
  notification_type: NotificationType;
  title: string;
  body: string;
  icon: string;
  link: string;
  related_object_type: string;
  related_object_id: number | null;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  read_at: string | null;
}

export interface NotificationPreference {
  id: number;
  notification_type: NotificationType;
  notification_type_display: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  push_enabled: boolean;
}

// ============================================================
// Audit
// ============================================================

export interface AuditLog {
  id: number;
  actor: UserPublic | null;
  action: string;
  target_type: string;
  target_id: number | null;
  target_repr: string;
  changes: Record<string, unknown>;
  metadata: { ip?: string; user_agent?: string; [key: string]: unknown };
  instance: string;
  created_at: string;
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardStats {
  total_materials: number;
  pending_verification: number;
  verified_materials: number;
  total_users: number;
  active_reports: number;
  total_subjects: number;
  my_materials?: number;
  my_pending?: number;
  my_verified?: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  actor?: UserPublic;
  link?: string;
}

export interface ChartDataPoint {
  date: string;
  count: number;
  label?: string;
}

export interface DashboardActivity {
  results: ActivityItem[];
  count: number;
}

// ============================================================
// Federation types
// ============================================================

export type TrustLevel = "trusted" | "neutral" | "blocked";
export type ActivityType =
  | "material_shared"
  | "material_updated"
  | "material_removed"
  | "user_reported"
  | "instance_announcement"
  | "instance_stats_update";
export type ActivityStatus = "received" | "processing" | "processed" | "failed";
export type BlockType = "manual" | "auto_spam_detection" | "reported";

export interface FederatedInstance {
  id: number;
  domain: string;
  name: string;
  description: string;
  logo: string | null;
  software_version: string;
  admin_email: string;
  public_key: string;
  public_key_fingerprint: string;
  trust_level: TrustLevel;
  is_home: boolean;
  registration_open: boolean;
  requires_approval: boolean;
  material_count: number;
  user_count: number;
  last_synced_stats_at: string | null;
  is_active: boolean;
  is_reachable: boolean;
  added_by_username: string;
  added_at: string;
  last_seen_at: string | null;
  metadata: Record<string, unknown>;
}

export interface FederatedActivity {
  id: number;
  from_instance: number;
  from_instance_domain: string;
  to_instance: number | null;
  to_instance_domain: string;
  activity_id: string;
  activity_type: ActivityType;
  payload: Record<string, unknown>;
  signature: string;
  status: ActivityStatus;
  error_message: string;
  retry_count: number;
  created_at: string;
  processed_at: string | null;
}

export interface FederatedMaterial {
  id: number;
  original_id: string;
  source_instance: number;
  source_instance_domain: string;
  source_instance_name: string;
  source_instance_logo: string | null;
  title: string;
  description: string;
  material_type: string;
  subject_name: string;
  semester_number: number | null;
  department_name: string;
  file_url: string;
  external_url: string;
  tags: string[];
  uploaded_by_username: string;
  verified_by_username: string;
  verification_status: string;
  view_count: number;
  download_count: number;
  original_created_at: string | null;
  synced_at: string;
  last_updated_at: string;
  is_removed: boolean;
}

export interface InstanceBlock {
  id: number;
  instance: number;
  instance_domain: string;
  instance_name: string;
  blocked_by: number | null;
  blocked_by_username: string;
  reason: string;
  block_type: BlockType;
  created_at: string;
}

export interface InstanceDiscoveryInfo {
  domain: string;
  name: string;
  description: string;
  software_version: string;
  public_key: string;
  registration_open: boolean;
  requires_approval: boolean;
  admin_email: string;
  material_count: number;
  user_count: number;
  supported_activity_types: string[];
}

export interface FederationMetrics {
  activities_received_24h: number;
  activities_failed: number;
  blocked_instances: number;
  trusted_instances: number;
  total_federated_materials: number;
}

export interface InstanceHealth {
  status: string;
  version: string;
  total_materials: number;
  total_users: number;
  is_accepting_activities: boolean;
}
