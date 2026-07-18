import { useEffect } from "react";

export default function DashboardPage() {
  useEffect(() => {
    const channel = new BroadcastChannel("google-auth");
    channel.postMessage({ type: "google-auth-success" });
    channel.close();
    window.close();
  }, []);

  return <h1>Signing you in...</h1>;
}
