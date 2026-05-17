import { Suspense } from "react";
import { useRoutes } from "react-router-dom";

import { routeConfig } from "./routerConfig";
import { Loader } from "@/shared";

const AppRouter = () => {
  const routes = useRoutes(routeConfig);

  return <Suspense fallback={<Loader fullScreen />}>{routes}</Suspense>;
};

export default AppRouter;
