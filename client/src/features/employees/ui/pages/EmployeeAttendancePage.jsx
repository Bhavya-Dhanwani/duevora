import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "../../api/employeesApi";
import { PageHeader, Button, DataTable, StatusBadge, Modal } from "../../../../app/components/common";
import useNotification from "../../../../app/components/notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";

const input = { display: "block", boxSizing: "border-box", width: "100%", marginTop: 5, padding: 9, border: "1px solid #cbd5e1", borderRadius: 7 };

export default function EmployeeAttendancePage() {
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotification();
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", date: new Date().toISOString().slice(0, 10), status: "present", checkIn: "", checkOut: "", notes: "" });

  const { data: empResponse, isLoading } = useQuery({
    queryKey: ["employeesList"],
    queryFn: () => employeesApi.list(),
  });
  const employees = empResponse?.data || [];

  const markAttendance = useMutation({
    mutationFn: (data) => employeesApi.markAttendance(data),
    onSuccess: () => {
      setIsMarkOpen(false);
      setForm({ employeeId: "", date: new Date().toISOString().slice(0, 10), status: "present", checkIn: "", checkOut: "", notes: "" });
      success("Attendance marked");
    },
    onError: (err) => notifyError(err.response?.data?.message || "Failed to mark attendance"),
  });

  const columns = [
    {
      key: "employee",
      label: "Employee",
      render: (_, row) => {
        const emp = employees.find((e) => e._id === row.employeeId);
        return emp ? `${emp.firstName} ${emp.lastName}` : row.employeeId;
      },
    },
    { key: "date", label: "Date", render: (val) => val ? new Date(val).toLocaleDateString("en-IN") : "—" },
    {
      key: "status",
      label: "Status",
      render: (val) => {
        const map = { present: "active", absent: "error", late: "pending", half_day: "pending" };
        return <StatusBadge status={map[val] || "pending"}>{(val || "—").toUpperCase()}</StatusBadge>;
      },
    },
    { key: "checkIn", label: "Check In", render: (val) => val || "—" },
    { key: "checkOut", label: "Check Out", render: (val) => val || "—" },
    { key: "notes", label: "Notes", render: (val) => val || "—" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <PageHeader
        title="Employee Attendance"
        subtitle="Track daily attendance for your team."
        action={<div style={{ display: "flex", gap: 10 }}><Button variant="secondary" icon={HiOutlineDocumentArrowDown} onClick={() => exportToPdf({ title: "Employee Attendance", filename: "employee-attendance", columns: [{ key: "employee", label: "Employee", render: (_, row) => { const emp = employees.find((e) => e._id === row.employeeId); return emp ? `${emp.firstName} ${emp.lastName}` : row.employeeId; } }, { key: "date", label: "Date", render: (v) => v ? new Date(v).toLocaleDateString("en-IN") : "—" }, { key: "status", label: "Status", render: (v) => (v || "—").toUpperCase() }, { key: "checkIn", label: "Check In" }, { key: "checkOut", label: "Check Out" }, { key: "notes", label: "Notes" }], data: [] })}>Export PDF</Button><Button variant="primary" onClick={() => setIsMarkOpen(true)}>Mark Attendance</Button></div>}
      />

      <DataTable columns={columns} data={[]} loading={isLoading} emptyTitle="No attendance records" emptyDescription="Start by marking attendance for today." />

      <Modal isOpen={isMarkOpen} onClose={() => setIsMarkOpen(false)} title="Mark Attendance">
        <form onSubmit={(e) => { e.preventDefault(); markAttendance.mutate(form); }} style={{ display: "grid", gap: 14 }}>
          <label>Employee<select required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} style={input}><option value="">Select employee</option>{employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.firstName} {emp.lastName}</option>)}</select></label>
          <label>Date<input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={input} /></label>
          <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={input}><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="half_day">Half Day</option></select></label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label>Check In<input type="time" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} style={input} /></label>
            <label>Check Out<input type="time" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} style={input} /></label>
          </div>
          <label>Notes<textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={input} /></label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Button type="button" variant="secondary" onClick={() => setIsMarkOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={markAttendance.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
