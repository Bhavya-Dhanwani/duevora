import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "../../../../features/notifications/api/notificationsApi";
import { PageHeader, Button } from "../../common";
import useNotification from "../../notification/useNotification";
import { exportToPdf } from "../../../../lib/exportToPdf";
import { HiOutlineDocumentArrowDown } from "react-icons/hi2";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { success, error: notifyError } = useNotification();

  const { data: resp, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list(),
  });
  const notifications = resp?.data?.notifications || [];

  const markRead = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries(["notifications"]),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(["notifications"]);
      success("All notifications marked as read");
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
        action={<div style={{ display: "flex", gap: 10 }}><Button variant="secondary" onClick={() => exportToPdf({ title: "Notifications", filename: "notifications", columns: [{ key: "title", label: "Title", render: (v, row) => v || row.message || "—" }, { key: "description", label: "Message", render: (v) => v || "—" }, { key: "isRead", label: "Read Status", render: (v) => v ? "Read" : "Unread" }, { key: "createdAt", label: "Date", render: (v) => v ? new Date(v).toLocaleString("en-IN") : "—" }], data: notifications })} icon={HiOutlineDocumentArrowDown}>Export PDF</Button>{unreadCount > 0 ? <Button variant="secondary" onClick={() => markAll.mutate()}>Mark All Read</Button> : undefined}</div>}
      />

      {isLoading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
      ) : notifications.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 40, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>&#128276;</div>
          <p style={{ color: "#64748b", margin: 0 }}>No notifications yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && markRead.mutate(n._id)}
              style={{
                background: n.isRead ? "#fff" : "#f0f9ff",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                padding: "14px 18px",
                cursor: n.isRead ? "default" : "pointer",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                transition: "background 0.15s",
              }}
            >
              {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563eb", flexShrink: 0, marginTop: 6 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: n.isRead ? 400 : 600, color: "#0f172a", marginBottom: 2 }}>{n.title || n.message}</div>
                {n.description && <div style={{ fontSize: 12, color: "#64748b" }}>{n.description}</div>}
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN") : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
