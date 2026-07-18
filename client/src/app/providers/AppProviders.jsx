import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NotificationProvider from "../components/notification/NotificationProvider";

const queryClient = new QueryClient();

export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </QueryClientProvider>
  );
}