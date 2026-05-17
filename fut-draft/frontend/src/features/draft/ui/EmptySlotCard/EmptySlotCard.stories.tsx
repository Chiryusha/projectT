import type { Meta, StoryObj } from "@storybook/react-vite";

import EmptySlotCard from "./EmptySlotCard";

const meta = {
  component: EmptySlotCard,
  title: "features/draft/EmptySlotCard",
} satisfies Meta<typeof EmptySlotCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const StrikerSlot: Story = {
  args: {
    label: "ST",
  },
};

export const GoalkeeperSlot: Story = {
  args: {
    label: "GK",
  },
};
