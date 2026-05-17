import type { Meta, StoryObj } from "@storybook/react-vite";

import { mockMidfielderCard, mockStrikerCard } from "@/shared/testing/mockDraftData";

import PlayerCard from "./PlayerCard";

const meta = {
  component: PlayerCard,
  decorators: [
    (Story) => (
      <div className="w-56">
        <Story />
      </div>
    ),
  ],
  title: "entities/player/PlayerCard",
} satisfies Meta<typeof PlayerCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const GoldStriker: Story = {
  args: {
    card: mockStrikerCard,
  },
};

export const PickableMidfielder: Story = {
  args: {
    card: mockMidfielderCard,
    onSelect: () => undefined,
  },
};

export const DisabledPick: Story = {
  args: {
    card: mockStrikerCard,
    disabled: true,
    onSelect: () => undefined,
  },
};
