import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "@/features/auth";
import { Loader } from "@/shared";

import { RoutePath } from "../routePaths";

const RequireGuest = () => {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (status === "checking") {
    return <Loader fullScreen />;
  }

  if (accessToken) {
    return <Navigate to={RoutePath.draft} replace />;
  }

  return <Outlet />;
};

export default RequireGuest;
