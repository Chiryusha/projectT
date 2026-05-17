import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";

import { useAuthStore } from "@/features/auth";
import { useDraftStore } from "@/features/draft";
import {
  createMockDraftSessionState,
  mockCompletedDraftSessionState,
  mockTournamentChampion,
} from "@/features/draft/testing/mockDraftState";
import { useGameSettingsStore } from "@/features/settings";

import TournamentPage from "./TournamentPage";

const setTournamentState = ({
  hasStartedTournament = false,
  tournament = null,
}: {
  hasStartedTournament?: boolean;
  tournament?: typeof mockTournamentChampion | null;
}) => {
  const sessionState = createMockDraftSessionState({
    ...mockCompletedDraftSessionState,
    session: {
      ...mockCompletedDraftSessionState.session,
      tournamentId: hasStartedTournament ? "tournament-id" : null,
    },
  });

  useAuthStore.setState({
    accessToken: "storybook-access-token",
    error: null,
    refreshToken: "storybook-refresh-token",
    status: "authenticated",
    user: {
      avatarUrl: null,
      email: "demo@futdraft.local",
      id: "user-id",
      nickname: "demo_user",
    },
  });

  useGameSettingsStore.setState({
    aiDifficulty: "normal",
    matchSpeed: "normal",
  });

  useDraftStore.setState({
    error: null,
    loadTournament: async () => undefined,
    sessionState,
    startTournament: async () => mockTournamentChampion,
    status: "idle",
    tournament,
  });
};

const meta = {
  component: TournamentPage,
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={["/tournament?sessionId=session-id"]}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  title: "pages/TournamentPage",
} satisfies Meta<typeof TournamentPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ReadyToStart: Story = {
  render: () => {
    setTournamentState({});

    return <TournamentPage />;
  },
};

export const AlreadyPlayed: Story = {
  render: () => {
    setTournamentState({ hasStartedTournament: true });

    return <TournamentPage />;
  },
};

export const BracketReady: Story = {
  render: () => {
    setTournamentState({
      hasStartedTournament: true,
      tournament: mockTournamentChampion,
    });

    return <TournamentPage />;
  },
};

export const WithError: Story = {
  render: () => {
    setTournamentState({});
    useDraftStore.setState({
      error: "Tournament request failed. Try again.",
    });

    return <TournamentPage />;
  },
};
