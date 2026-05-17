import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  mockTournamentChampion,
  mockTournamentEliminated,
} from "../../testing/mockDraftState";
import TournamentResult from "./TournamentResult";

const meta = {
  component: TournamentResult,
  decorators: [
    (Story) => (
      <div className="w-[960px]">
        <Story />
      </div>
    ),
  ],
  title: "features/draft/TournamentResult",
} satisfies Meta<typeof TournamentResult>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Champion: Story = {
  args: {
    tournament: mockTournamentChampion,
  },
};

export const Eliminated: Story = {
  args: {
    tournament: mockTournamentEliminated,
  },
};
