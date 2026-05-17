import type { Meta, StoryObj } from "@storybook/react-vite";

import { mockFormation } from "@/shared/testing/mockDraftData";

import {
  createMockDraftSessionState,
  mockCompletedDraftSessionState,
} from "../../testing/mockDraftState";
import SquadBoard from "./SquadBoard";

const emptyState = createMockDraftSessionState({
  chemistry: {
    averagePlayerChemistry: 0,
    maxTeamChemistry: 100,
    players: [],
    teamChemistry: 0,
  },
  options: [],
  optionsSlotNo: null,
  picks: [],
  session: {
    completedAt: null,
    currentSlot: 1,
    formation: "4-3-3",
    goalkeepersPicked: 0,
    goalkeepersRequired: 2,
    id: "session-id",
    pickedCount: 0,
    remainingSlots: 18,
    startedAt: "2026-05-15T10:30:00.000Z",
    status: "IN_PROGRESS",
    totalSlots: 18,
    tournamentId: null,
    userId: "user-id",
  },
});

const meta = {
  component: SquadBoard,
  decorators: [
    (Story) => (
      <div className="w-[1440px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  title: "features/draft/SquadBoard",
} satisfies Meta<typeof SquadBoard>;

export default meta;

type Story = StoryObj<typeof meta>;

const baseArgs = {
  formation: mockFormation,
  isLoadingOptions: false,
  isPicking: false,
  isSwapping: false,
  onClosePickDrawer: () => undefined,
  onPickPlayer: () => undefined,
  onSlotClick: () => undefined,
  selectedSwapSlotNo: null,
} satisfies Partial<Story["args"]>;

export const EmptyDraft: Story = {
  args: {
    ...baseArgs,
    openedPickSlotNo: null,
    sessionState: emptyState,
  },
};

export const PickDrawerOpen: Story = {
  args: {
    ...baseArgs,
    openedPickSlotNo: 10,
    sessionState: createMockDraftSessionState(),
  },
};

export const SwapSelection: Story = {
  args: {
    ...baseArgs,
    openedPickSlotNo: null,
    selectedSwapSlotNo: 10,
    sessionState: createMockDraftSessionState(),
  },
};

export const CompletedSquad: Story = {
  args: {
    ...baseArgs,
    openedPickSlotNo: null,
    sessionState: mockCompletedDraftSessionState,
  },
};
