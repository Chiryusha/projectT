import type { RouteObject } from "react-router-dom";

import RequireAuth from "./guards/RequireAuth";
import RequireGuest from "./guards/RequireGuest";
import { RoutePath } from "./routePaths";

import { IntroductionPageAsync } from "@/pages/introduction";
import { LineupsPageAsync } from "@/pages/lineups";
import { LoginPageAsync } from "@/pages/login";
import { NotFoundPageAsync } from "@/pages/not-found";
import { ProfilePageAsync } from "@/pages/profile";
import { RegisterPageAsync } from "@/pages/register";
import { SettingsPageAsync } from "@/pages/settings";
import { DraftPageAsync } from "@/pages/draft";
import { TournamentPageAsync } from "@/pages/tournament";

export const routeConfig: RouteObject[] = [
  {
    path: RoutePath.main,
    element: <IntroductionPageAsync />,
  },
  {
    element: <RequireGuest />,
    children: [
      {
        path: RoutePath.login,
        element: <LoginPageAsync />,
      },
      {
        path: RoutePath.register,
        element: <RegisterPageAsync />,
      },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: RoutePath.settings,
        element: <SettingsPageAsync />,
      },
      {
        path: RoutePath.profile,
        element: <ProfilePageAsync />,
      },
      {
        path: RoutePath.draft,
        element: <DraftPageAsync />,
      },
      {
        path: RoutePath.tournament,
        element: <TournamentPageAsync />,
      },
      {
        path: RoutePath.lineups,
        element: <LineupsPageAsync />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPageAsync />,
  },
];
