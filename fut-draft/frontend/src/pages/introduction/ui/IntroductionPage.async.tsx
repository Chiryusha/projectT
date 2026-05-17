import { lazy } from "react";

const IntroductionPageAsync = lazy(() => import("./IntroductionPage"));

export default IntroductionPageAsync;
