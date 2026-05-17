import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "@/features/auth";
import { Loader } from "@/shared";

import { RoutePath } from "../routePaths";

const RequireAuth = () => {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (status === "checking") {
    return <Loader fullScreen />;
  }

  if (!accessToken) {
    return <Navigate to={RoutePath.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
