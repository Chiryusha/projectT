export const RoutePath = {
  main: "/",
  login: "/login",
  register: "/register",
  draft: "/draft",
  tournament: "/tournament",
  lineups: "/lineups",
  settings: "/settings",
  profile: "/profile/:userId",
  getProfile: (userId: string) => `/profile/${encodeURIComponent(userId)}`,
} as const;
