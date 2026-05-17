import type { Meta, StoryObj } from "@storybook/react-vite";

import { mockStrikerCard } from "@/shared/testing/mockDraftData";

import MiniPickedCard from "./MiniPickedCard";

const meta = {
  component: MiniPickedCard,
  title: "entities/player/MiniPickedCard",
} satisfies Meta<typeof MiniPickedCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PickedStarter: Story = {
  args: {
    card: mockStrikerCard,
  },
};
