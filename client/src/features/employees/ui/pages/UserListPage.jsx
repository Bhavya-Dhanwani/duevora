import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, rolesApi, employeesApi } from "../../api/employeesApi";
import {
  PageHeader,
  Button,
  Tabs,
  DataTable,
  Modal,
  StatusBadge,
  Avatar,
  AccessDenied,
} from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { HiPlus, HiOutlineUserPlus, HiOutlineShieldCheck, HiOutlineClipboard, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import s from "../css/UserList.module.css";

export default function UserListPage() {
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotification();
  const [activeTab, setActiveTab] = useState("users");
  const [permissionError, setPermissionError] = useState(false);

  // Users listing pagination/search states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [inviteSuccessData, setInviteSuccessData] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Custom role modal state
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  // Active role editing permissions matrix state
  const [activeRoleId, setActiveRoleId] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState(new Set());
  const [savePermissionsLoading, setSavePermissionsLoading] = useState(false);

  // Queries
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ["usersList", page, pageSize, search],
    queryFn: async () => {
      try {
        return await usersApi.list({ page, limit: pageSize, search });
      } catch (err) {
        if (err.response?.status === 403) {
          setPermissionError(true);
        }
        throw err;
      }
    },
    retry: false,
  });

  const { data: rolesResponse, refetch: refetchRoles } = useQuery({
    queryKey: ["rolesList"],
    queryFn: async () => {
      try {
        return await rolesApi.list();
      } catch (err) {
        if (err.response?.status === 403) {
          setPermissionError(true);
        }
        throw err;
      }
    },
    retry: false,
  });

  const { data: permissionsResponse } = useQuery({
    queryKey: ["permissionsList"],
    queryFn: () => rolesApi.listPermissions(),
    enabled: activeTab === "roles",
  });

  const roles = rolesResponse?.data || [];
  const permissionsList = permissionsResponse?.data || [];

  // Sync active role permission sets
  useEffect(() => {
    if (roles.length > 0 && !activeRoleId) {
      setActiveRoleId(roles[0]._id);
    }
  }, [roles, activeRoleId]);

  useEffect(() => {
    const selectedRole = roles.find((r) => r._id === activeRoleId);
    if (selectedRole?.permissions) {
      setSelectedPermissions(new Set(selectedRole.permissions));
    } else {
      setSelectedPermissions(new Set());
    }
  }, [activeRoleId, roles]);

  if (permissionError) {
    return <AccessDenied />;
  }

  // Handle Invite Member
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteRoleId) return;
    setInviteLoading(true);
    setInviteSuccessData(null);
    try {
      const res = await employeesApi.invite({ email: inviteEmail, roleId: inviteRoleId });
      setInviteSuccessData(res.data);
      setInviteEmail("");
      queryClient.invalidateQueries(["usersList"]);
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to invite member");
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle Create Role
  const handleCreateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleName || !roleCode) return;
    setRoleLoading(true);
    try {
      await rolesApi.create({ name: roleName, code: roleCode, description: roleDesc });
      setRoleName("");
      setRoleCode("");
      setRoleDesc("");
      setIsCreateRoleOpen(false);
      refetchRoles();
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to create role");
    } finally {
      setRoleLoading(false);
    }
  };

  // Handle Save Permissions
  const handleSavePermissions = async () => {
    if (!activeRoleId) return;
    setSavePermissionsLoading(true);
    try {
      await rolesApi.setPermissions(activeRoleId, {
        permissionIds: Array.from(selectedPermissions),
      });
      success("Permissions updated successfully!");
      refetchRoles();
    } catch (err) {
      notifyError(err.response?.data?.message || "Failed to save permissions");
    } finally {
      setSavePermissionsLoading(false);
    }
  };

  // Toggle permission checkbox
  const handlePermissionToggle = (permId) => {
    const copy = new Set(selectedPermissions);
    if (copy.has(permId)) {
      copy.delete(permId);
    } else {
      copy.add(permId);
    }
    setSelectedPermissions(copy);
  };

  // Group permissions by namespace
  const groupedPermissions = {};
  permissionsList.forEach((perm) => {
    const parts = perm.code.split(".");
    const module = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "General";
    if (!groupedPermissions[module]) {
      groupedPermissions[module] = [];
    }
    groupedPermissions[module].push(perm);
  });

  // Columns for Users Table
  const userColumns = [
    {
      key: "name",
      label: "User Name",
      render: (_, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Avatar name={row.name} size={32} />
          <span style={{ fontWeight: 600, fontSize: "13px" }}>{row.name}</span>
        </div>
      ),
    },
    { key: "email", label: "Email Address" },
    {
      key: "isVerified",
      label: "Status",
      render: (val) => (
        <StatusBadge status={val ? "active" : "pending"}>
          {val ? "Active" : "Pending Invite"}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className={s.container}>
      <div className={s.actionHeader}>
        <PageHeader title="Identity & Settings" subtitle="Configure system roles, permissions, and team access." />
        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Users", filename: "users", columns: [{ key: "name", label: "User Name" }, { key: "email", label: "Email Address" }, { key: "isVerified", label: "Status", render: (v) => v ? "Active" : "Pending Invite" }], data: usersResponse?.data || [] })}>
            Export PDF
          </Button>
          {activeTab === "users" ? (
            <Button onClick={() => { setInviteSuccessData(null); setIsInviteOpen(true); }} variant="primary" icon={HiOutlineUserPlus}>
              Invite Member
            </Button>
          ) : (
            <Button onClick={() => setIsCreateRoleOpen(true)} variant="primary" icon={HiPlus}>
              Create Role
            </Button>
          )}
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "users", label: "Users & Staff" },
          { key: "roles", label: "Roles & Permission Matrix" },
        ]}
        active={activeTab}
        onChange={(tab) => setActiveTab(tab)}
      />

      {activeTab === "users" ? (
        <div className={s.tabContent}>
          <DataTable
            columns={userColumns}
            data={usersResponse?.data || []}
            loading={usersLoading}
            page={page}
            totalPages={usersResponse?.pagination?.pages || 1}
            total={usersResponse?.pagination?.total || 0}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : (
        <div className={[s.tabContent, s.rolesGrid].join(" ")}>
          {/* Left Panel: Roles */}
          <div className={s.rolesSidebar}>
            <h3 style={{ fontSize: "13px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
              Organization Roles
            </h3>
            <div className={s.roleList}>
              {roles.map((role) => (
                <button
                  key={role._id}
                  className={[s.roleItem, activeRoleId === role._id && s.active].filter(Boolean).join(" ")}
                  onClick={() => setActiveRoleId(role._id)}
                  type="button"
                >
                  <div className={s.roleName}>{role.name}</div>
                  <div className={s.roleDesc}>{role.description || "No description provided."}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Permissions */}
          <div className={s.permissionsPanel}>
            <div className={s.panelHeader}>
              <div>
                <div className={s.panelTitle}>
                  Permissions matrix: {roles.find((r) => r._id === activeRoleId)?.name || "Select Role"}
                </div>
                <div className={s.panelSubtitle}>
                  Check modules to grant/revoke security rights.
                </div>
              </div>
              <Button onClick={handleSavePermissions} loading={savePermissionsLoading} variant="primary" icon={HiOutlineShieldCheck}>
                Save Bindings
              </Button>
            </div>

            {Object.keys(groupedPermissions).map((module) => (
              <div key={module} className={s.moduleSection}>
                <h4 className={s.moduleTitle}>{module}</h4>
                <div className={s.permissionGrid}>
                  {groupedPermissions[module].map((perm) => (
                    <label key={perm._id} className={s.checkboxLabel}>
                      <input
                        className={s.checkboxInput}
                        type="checkbox"
                        checked={selectedPermissions.has(perm._id)}
                        onChange={() => handlePermissionToggle(perm._id)}
                      />
                      <div>
                        <div className={s.permTitle}>{perm.name}</div>
                        <div className={s.permDesc}>{perm.description || `Allows access to ${perm.code}`}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Staff Member">
        {inviteSuccessData ? (
          <div className={s.successBox}>
            <div className={s.successText}>Invitation Link Generated successfully!</div>
            <div style={{ fontSize: "11px", color: "#166534", marginBottom: "8px" }}>
              Copy and paste this link in a new tab to sign up:
            </div>
            <div className={s.linkGroup}>
              <input readOnly className={s.linkInput} value={inviteSuccessData.inviteUrl} id="invite-url-input" />
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(inviteSuccessData.inviteUrl);
                  success("Link copied to clipboard!");
                }}
                variant="secondary"
              >
                <HiOutlineClipboard /> Copy
              </Button>
            </div>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setIsInviteOpen(false)} variant="primary">Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleInviteSubmit}>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Email Address</label>
              <input
                required
                className={s.formInput}
                type="email"
                placeholder="colleague@yourcompany.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className={s.formGroup}>
              <label className={s.formLabel}>Assign System Role</label>
              <select
                required
                className={s.formSelect}
                value={inviteRoleId}
                onChange={(e) => setInviteRoleId(e.target.value)}
              >
                <option value="">Select a role...</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <Button onClick={() => setIsInviteOpen(false)} variant="secondary">Cancel</Button>
              <Button type="submit" loading={inviteLoading} variant="primary">Send Invite</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Custom Role Modal */}
      <Modal isOpen={isCreateRoleOpen} onClose={() => setIsCreateRoleOpen(false)} title="Create Custom Role">
        <form onSubmit={handleCreateRoleSubmit}>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Role Name</label>
            <input
              required
              className={s.formInput}
              type="text"
              placeholder="e.g. Internal Auditor"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Role Code (Uppercase)</label>
            <input
              required
              className={s.formInput}
              type="text"
              placeholder="e.g. AUDITOR"
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value.toUpperCase())}
            />
          </div>
          <div className={s.formGroup}>
            <label className={s.formLabel}>Description</label>
            <textarea
              rows={3}
              className={s.formTextarea}
              placeholder="Brief description of this role's purpose..."
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button onClick={() => setIsCreateRoleOpen(false)} variant="secondary">Cancel</Button>
            <Button type="submit" loading={roleLoading} variant="primary">Create Role</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
