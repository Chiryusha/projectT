import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import type { UserProfile } from "@/entities/user";
import { useAuthStore } from "@/features/auth";
import { useProfileStore } from "@/features/profile";

import ProfilePage from "./ProfilePage";

const mockAvatarUrl =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Crect width='240' height='240' fill='%2317251f'/%3E%3Ccircle cx='120' cy='88' r='38' fill='%23fcd34d'/%3E%3Cpath d='M52 220c10-48 37-75 68-75s58 27 68 75z' fill='%236ee7b7'/%3E%3Ctext x='120' y='132' text-anchor='middle' font-family='Arial' font-size='24' font-weight='700' fill='%2308110e'%3EFD%3C/text%3E%3C/svg%3E";

const mockProfile: UserProfile = {
  avatarUrl: mockAvatarUrl,
  createdAt: "2026-05-15T10:00:00.000Z",
  email: "demo@futdraft.local",
  id: "user-id",
  nickname: "demo_user",
  stats: {
    savedSquads: 4,
    tournamentsPlayed: 9,
    tournamentsWon: 3,
  },
};

const setProfileState = ({
  error = null,
  profile = mockProfile,
  status = "idle",
}: {
  error?: string | null;
  profile?: UserProfile | null;
  status?: "idle" | "loading" | "saving";
}) => {
  const authUser = profile ?? {
    avatarUrl: null,
    createdAt: mockProfile.createdAt,
    email: mockProfile.email,
    id: mockProfile.id,
    nickname: mockProfile.nickname,
  };

  useAuthStore.setState({
    accessToken: "storybook-access-token",
    error: null,
    logout: async () => undefined,
    refreshToken: "storybook-refresh-token",
    status: "authenticated",
    syncUser: (user) => useAuthStore.setState({ user }),
    user: authUser,
  });

  useProfileStore.setState({
    error,
    loadProfile: async () => undefined,
    profile,
    status,
    updateAvatar: async (avatarUrl) => {
      const nextProfile = {
        ...(profile ?? mockProfile),
        avatarUrl,
      };

      useProfileStore.setState({ profile: nextProfile, status: "idle" });
      useAuthStore.getState().syncUser(nextProfile);

      return nextProfile;
    },
  });
};

const meta = {
  component: ProfilePage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/profile/user-id"]}>
        <Routes>
          <Route element={<Story />} path="/profile/:userId" />
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  title: "pages/ProfilePage",
} satisfies Meta<typeof ProfilePage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithAvatar: Story = {
  render: () => {
    setProfileState({});

    return <ProfilePage />;
  },
};

export const WithoutAvatar: Story = {
  render: () => {
    setProfileState({
      profile: {
        ...mockProfile,
        avatarUrl: null,
        stats: {
          savedSquads: 1,
          tournamentsPlayed: 2,
          tournamentsWon: 0,
        },
      },
    });

    return <ProfilePage />;
  },
};

export const SavingAvatar: Story = {
  render: () => {
    setProfileState({ status: "saving" });

    return <ProfilePage />;
  },
};

export const WithError: Story = {
  render: () => {
    setProfileState({
      error: "Profile request failed. Try again.",
    });

    return <ProfilePage />;
  },
};
