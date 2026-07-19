import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "../store";
import NotificationProvider from "../components/notification/NotificationProvider";

const queryClient = new QueryClient();

export default function AppProviders({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          
        
            {children}
          
        </NotificationProvider>
      </QueryClientProvider>
    </Provider>
  );
}
