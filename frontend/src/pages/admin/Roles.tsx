import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { USER_PERMISSIONS } from "@/lib/permissions";
import type {
  Role,
  UserRole,
  RoleRequest,
  PaginatedResponse,
  RoleWritePayload,
  RoleRequestReviewPayload,
} from "@/types";

// ---------------------------------------------------------------------------
// Tab: Role Definitions
// ---------------------------------------------------------------------------

function RolesTab() {
  const { can } = useAuth();
  const queryClient = useQueryClient();
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () =>
      api.get<PaginatedResponse<Role>>("/api/roles/definitions/").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: RoleWritePayload) =>
      api.post("/api/roles/definitions/", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setShowCreate(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: RoleWritePayload & { id: number }) =>
      api.patch(`/api/roles/definitions/${id}/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setEditingRole(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/roles/definitions/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading roles…</p>;

  return (
    <div className="space-y-4">
      {can(USER_PERMISSIONS.MANAGE_ROLES) && (
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + New role
        </Button>
      )}

      {showCreate && (
        <RoleForm
          onSubmit={(payload) => createMutation.mutate(payload)}
          onCancel={() => setShowCreate(false)}
          isLoading={createMutation.isPending}
        />
      )}

      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              {can(USER_PERMISSIONS.MANAGE_ROLES) && (
                <th className="px-4 py-3" />
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles?.results.map((role) => (
              <tr key={role.id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{role.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{role.description || "—"}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{role.permissions.length} permissions</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${role.is_system_role ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {role.is_system_role ? "System" : "Custom"}
                  </span>
                </td>
                {can(USER_PERMISSIONS.MANAGE_ROLES) && (
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    {!role.is_system_role && (
                      <>
                        <button
                          onClick={() => setEditingRole(role)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(role.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingRole && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">Edit role: {editingRole.name}</h3>
            <RoleForm
              defaultValues={editingRole}
              onSubmit={(payload) =>
                updateMutation.mutate({ id: editingRole.id, ...payload })
              }
              onCancel={() => setEditingRole(null)}
              isLoading={updateMutation.isPending}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared role form
// ---------------------------------------------------------------------------

interface RoleFormProps {
  defaultValues?: Partial<Role>;
  onSubmit: (payload: RoleWritePayload) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function RoleForm({ defaultValues, onSubmit, onCancel, isLoading }: RoleFormProps) {
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [permsText, setPermsText] = useState(
    (defaultValues?.permissions ?? []).join("\n")
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      name,
      description,
      permissions: permsText
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Permissions <span className="text-gray-400 font-normal">(one per line)</span>
        </label>
        <textarea
          value={permsText}
          onChange={(e) => setPermsText(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? "Saving…" : "Save"}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Tab: Users & Roles
// ---------------------------------------------------------------------------

function UserRolesTab() {
  const { can } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-roles"],
    queryFn: () =>
      api.get<PaginatedResponse<UserRole>>("/api/roles/assignments/").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/roles/assignments/${id}/`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-roles"] }),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading assignments…</p>;

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scope</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned by</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
            {can(USER_PERMISSIONS.ASSIGN_ROLES) && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data?.results.map((ur) => (
            <tr key={ur.id}>
              <td className="px-4 py-3 text-sm text-gray-900">
                {ur.user.display_name || ur.user.username}
              </td>
              <td className="px-4 py-3 text-sm text-gray-900">{ur.role.name}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{ur.scope}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {ur.assigned_by ? (ur.assigned_by.display_name || ur.assigned_by.username) : "System"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {new Date(ur.assigned_at).toLocaleDateString()}
              </td>
              {can(USER_PERMISSIONS.ASSIGN_ROLES) && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteMutation.mutate(ur.id)}
                    className="text-red-600 hover:underline text-xs"
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Role Requests
// ---------------------------------------------------------------------------

function RoleRequestsTab() {
  const { can } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["role-requests"],
    queryFn: () =>
      api.get<PaginatedResponse<RoleRequest>>("/api/roles/requests/?status=pending").then((r) => r.data),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RoleRequestReviewPayload }) =>
      api.post(`/api/roles/requests/${id}/review/`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["role-requests"] }),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading requests…</p>;

  if (!data?.results.length) {
    return <p className="text-sm text-gray-500">No pending role requests.</p>;
  }

  return (
    <div className="space-y-3">
      {data.results.map((req) => (
        <div key={req.id} className="bg-white shadow rounded-lg p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {req.user.display_name || req.user.username} requested{" "}
                <span className="font-semibold">{req.requested_role.name}</span>
              </p>
              <p className="text-xs text-gray-500">
                {new Date(req.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
              {req.status}
            </span>
          </div>
          {req.justification && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
              {req.justification}
            </p>
          )}
          {can(USER_PERMISSIONS.REVIEW_ROLE_REQUESTS) && req.status === "pending" && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() =>
                  reviewMutation.mutate({ id: req.id, payload: { status: "approved" } })
                }
                disabled={reviewMutation.isPending}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  reviewMutation.mutate({ id: req.id, payload: { status: "rejected" } })
                }
                disabled={reviewMutation.isPending}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type Tab = "roles" | "assignments" | "requests";

export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("roles");

  const tabs: { id: Tab; label: string }[] = [
    { id: "roles", label: "Role Definitions" },
    { id: "assignments", label: "Users & Roles" },
    { id: "requests", label: "Role Requests" },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage roles, assignments, and role requests.
        </p>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "roles" && <RolesTab />}
      {activeTab === "assignments" && <UserRolesTab />}
      {activeTab === "requests" && <RoleRequestsTab />}
    </div>
  );
}
