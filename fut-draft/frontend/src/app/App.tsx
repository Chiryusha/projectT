import { useEffect } from "react";

import { useFrontendErrorLogging, usePageAnalytics } from "@/features/analytics";
import { useAuthStore } from "@/features/auth";

import { ErrorBoundary } from "./providers/error-boundary";
import AppRouter from "./providers/router/AppRouter";

const App = () => {
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  usePageAnalytics();
  useFrontendErrorLogging();

  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
};

export default App;
