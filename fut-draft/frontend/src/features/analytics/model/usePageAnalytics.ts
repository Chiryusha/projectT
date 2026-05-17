import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { trackPageView } from "../api/analyticsApi";

export const usePageAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);
};