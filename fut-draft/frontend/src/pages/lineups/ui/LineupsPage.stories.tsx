import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";

import { useSavedSquadsStore } from "@/features/savedSquads";
import { mockSavedSquad } from "@/shared/testing/mockDraftData";

import LineupsPage from "./LineupsPage";

const setLineupsState = () => {
  useSavedSquadsStore.setState({
    clearSavedSquads: async () => undefined,
    deleteSavedSquad: async () => undefined,
    error: null,
    loadSavedSquads: async () => undefined,
    savedSquads: [mockSavedSquad],
    status: "idle",
  });
};

const meta = {
  component: LineupsPage,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  title: "pages/LineupsPage",
} satisfies Meta<typeof LineupsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SavedSquads: Story = {
  render: () => {
    setLineupsState();

    return <LineupsPage />;
  },
};
