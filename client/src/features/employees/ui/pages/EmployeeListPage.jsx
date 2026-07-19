import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HiOutlineUserPlus, HiPlus, HiOutlineClipboard, HiOutlineDocumentArrowDown } from "react-icons/hi2";
import { departmentsApi, employeesApi, rolesApi } from "../../api/employeesApi";
import { Button, DataTable, Modal, PageHeader, Tabs } from "../../../../app/components/common";
import { exportToPdf } from "../../../../lib/exportToPdf";

const input = { display: "block", boxSizing: "border-box", width: "100%", padding: "9px", marginTop: 5, border: "1px solid #cbd5e1", borderRadius: 7 };
const departmentBlank = { name: "", code: "" };
export default function EmployeeListPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("employees");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [emails, setEmails] = useState("");
  const [roleId, setRoleId] = useState("");
  const [inviteResults, setInviteResults] = useState([]);
  const [generatedLink, setGeneratedLink] = useState("");
  const [department, setDepartment] = useState(departmentBlank);
  const employees = useQuery({ queryKey: ["employees"], queryFn: () => employeesApi.list() });
  const departments = useQuery({ queryKey: ["departments"], queryFn: () => departmentsApi.list() });
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => rolesApi.list() });
  
  const generateGeneric = useMutation({
    mutationFn: async (selectedRoleId) => {
      const res = await employeesApi.invite({ roleId: selectedRoleId });
      return res.data?.inviteUrl;
    },
    onSuccess: (url) => {
      setGeneratedLink(url);
    }
  });

  const invite = useMutation({ mutationFn: async ({ emailList, selectedRoleId }) => { const settled = await Promise.allSettled(emailList.map((email) => employeesApi.invite({ email, roleId: selectedRoleId }))); return settled.map((item, index) => item.status === "fulfilled" ? { email: emailList[index], ok: true, inviteUrl: item.value?.data?.inviteUrl } : { email: emailList[index], ok: false, message: item.reason?.response?.data?.message || "Invitation failed" }); }, onSuccess: (results) => { setInviteResults(results); qc.invalidateQueries({ queryKey: ["employees"] }); } });
  const createDepartment = useMutation({ mutationFn: departmentsApi.create, onSuccess: () => { qc.invalidateQueries({ queryKey: ["departments"] }); setDepartment(departmentBlank); setDepartmentOpen(false); } });
  const staff = employees.data?.data || []; const teams = departments.data?.data || []; const roleRows = roles.data?.data || [];
  const handleGenerate = (event) => { event.preventDefault(); if (roleId) generateGeneric.mutate(roleId); };
  const handleSendEmails = (event) => { event.preventDefault(); const emailList = [...new Set(emails.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))]; if (emailList.length) invite.mutate({ emailList, selectedRoleId: roleId }); };
  const addDepartment = (event) => { event.preventDefault(); createDepartment.mutate(department); };
  const copyLink = async (url) => { try { await navigator.clipboard.writeText(url); } catch { /* browser fallback not required */ } };
  return <div style={{ maxWidth: 1300, margin: "0 auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}><PageHeader title="Employees & Departments" subtitle="Invite team members with their role; accepted invites create their employee access." /><div style={{ display: "flex", gap: 10 }}><Button variant="secondary" onClick={() => exportToPdf({ title: tab === "employees" ? "Employees" : "Departments", filename: tab === "employees" ? "employees" : "departments", columns: tab === "employees" ? [{ key: "employeeCode", label: "Code" }, { key: "firstName", label: "Name", render: (_, row) => `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.user?.name || "—" }, { key: "email", label: "Email", render: (v, row) => v || row.user?.email || "—" }, { key: "department", label: "Department", render: (v) => v?.name || "—" }, { key: "joiningDate", label: "Joined", render: (v) => v ? new Date(v).toLocaleDateString() : "Pending" }] : [{ key: "code", label: "Code" }, { key: "name", label: "Department" }, { key: "manager", label: "Manager", render: (v) => v?.name || "—" }], data: tab === "employees" ? staff : teams })} icon={HiOutlineDocumentArrowDown}>Export PDF</Button>{tab === "employees" ? <Button variant="primary" onClick={() => { setInviteResults([]); setEmails(""); setRoleId(""); setGeneratedLink(""); setInviteOpen(true); }} icon={HiOutlineUserPlus}>Invite employees</Button> : <Button variant="primary" onClick={() => setDepartmentOpen(true)} icon={HiPlus}>Add department</Button>}</div></div>
    <Tabs active={tab} onChange={setTab} tabs={[{ key: "employees", label: "Employees" }, { key: "departments", label: "Departments" }]} />
    {tab === "employees" ? <DataTable loading={employees.isLoading} data={staff} columns={[{ key: "employeeCode", label: "Code" }, { key: "firstName", label: "Name", render: (_, row) => `${row.firstName || ""} ${row.lastName || ""}`.trim() || row.user?.name || "Pending invite" }, { key: "email", label: "Email", render: (value, row) => value || row.user?.email || "—" }, { key: "department", label: "Department", render: (value) => value?.name || "—" }, { key: "joiningDate", label: "Joined", render: (value) => value ? new Date(value).toLocaleDateString() : "Pending" }]} /> : <DataTable loading={departments.isLoading} data={teams} columns={[{ key: "code", label: "Code" }, { key: "name", label: "Department" }, { key: "manager", label: "Manager", render: (value) => value?.name || "—" }]} />}
    
    <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite employees">
      {inviteResults.length ? (
        <div style={{ display: "grid", gap: 14 }}>
          <p style={{ margin: 0 }}>Invitation emails have been sent. Each invite expires in 15 minutes; copy a link below only if you also want to share it manually.</p>
          <div style={{ display: "grid", gap: 8 }}>
            {inviteResults.map((result) => (
              <div key={result.email} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 10 }}>
                <strong style={{ color: result.ok ? "#15803d" : "#b91c1c" }}>{result.email}</strong>
                <div style={{ fontSize: 12, marginTop: 4 }}>{result.ok ? "Email sent" : result.message}</div>
                {result.ok && result.inviteUrl && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <input readOnly value={result.inviteUrl} style={{ ...input, marginTop: 0 }} />
                    <Button type="button" variant="secondary" onClick={() => copyLink(result.inviteUrl)}>
                      <HiOutlineClipboard />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="primary" onClick={() => setInviteOpen(false)}>Done</Button>
          </div>
        </div>
      ) : generatedLink ? (
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={{ fontWeight: 650, color: "#334155" }}>Invitation link</label>
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input readOnly value={generatedLink} style={{ ...input, marginTop: 0 }} />
              <Button type="button" variant="secondary" onClick={() => copyLink(generatedLink)}>
                <HiOutlineClipboard />
              </Button>
            </div>
            <small style={{ color: "#64748b", display: "block", marginTop: 6 }}>This link is valid for 15 minutes. Share it directly with anyone you want to register under this role.</small>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #e2e8f0", margin: "6px 0" }} />

          <form onSubmit={handleSendEmails} style={{ display: "grid", gap: 13 }}>
            <label><strong>Or send invitation emails</strong>
              <textarea required rows={4} placeholder="person1@company.com&#10;person2@company.com" value={emails} onChange={(e) => setEmails(e.target.value)} style={input} />
            </label>
            <small style={{ color: "#64748b" }}>Enter email addresses separated by a comma, space, or new line.</small>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Close</Button>
              <Button type="submit" variant="primary" loading={invite.isPending}>Send invitation emails</Button>
            </div>
            {invite.isError && <small style={{ color: "#b91c1c" }}>{invite.error?.response?.data?.message || "Could not send invitations."}</small>}
          </form>
        </div>
      ) : (
        <form onSubmit={handleGenerate} style={{ display: "grid", gap: 13 }}>
          <label>Role
            <select required value={roleId} onChange={(e) => setRoleId(e.target.value)} style={input}>
              <option value="">Select role</option>
              {roleRows.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}
            </select>
          </label>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>The selected role is applied to the invitation. Generating the link allows you to share it directly or send email invites.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={generateGeneric.isPending}>Generate invite</Button>
          </div>
          {generateGeneric.isError && <small style={{ color: "#b91c1c" }}>{generateGeneric.error?.response?.data?.message || "Could not generate link."}</small>}
        </form>
      )}
    </Modal>

    <Modal isOpen={departmentOpen} onClose={() => setDepartmentOpen(false)} title="Add department"><form onSubmit={addDepartment} style={{ display: "grid", gap: 13 }}><label>Department name<input required value={department.name} onChange={(e) => setDepartment({ ...department, name: e.target.value })} style={input}/></label><label>Department code<input required value={department.code} onChange={(e) => setDepartment({ ...department, code: e.target.value.toUpperCase() })} style={input}/></label><div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}><Button type="button" variant="secondary" onClick={() => setDepartmentOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={createDepartment.isPending}>Save</Button></div></form></Modal>
  </div>;
}