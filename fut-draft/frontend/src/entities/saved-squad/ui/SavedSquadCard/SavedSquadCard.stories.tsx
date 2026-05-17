import type { Meta, StoryObj } from "@storybook/react-vite";

import { mockSavedSquad } from "@/shared/testing/mockDraftData";

import SavedSquadCard from "./SavedSquadCard";

const meta = {
  component: SavedSquadCard,
  decorators: [
    (Story) => (
      <div className="w-[360px]">
        <Story />
      </div>
    ),
  ],
  title: "entities/saved-squad/SavedSquadCard",
} satisfies Meta<typeof SavedSquadCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: () => undefined,
    squad: mockSavedSquad,
  },
};

export const SelectedWithDelete: Story = {
  args: {
    isSelected: true,
    onClick: () => undefined,
    onDelete: () => undefined,
    squad: mockSavedSquad,
  },
};
