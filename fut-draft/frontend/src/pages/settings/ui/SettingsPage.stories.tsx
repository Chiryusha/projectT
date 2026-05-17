import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";

import { useGameSettingsStore } from "@/features/settings";

import SettingsPage from "./SettingsPage";

const meta = {
  component: SettingsPage,
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
  title: "pages/SettingsPage",
} satisfies Meta<typeof SettingsPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    useGameSettingsStore.setState({
      aiDifficulty: "normal",
      matchSpeed: "normal",
    });

    return <SettingsPage />;
  },
};

export const HardAndFast: Story = {
  render: () => {
    useGameSettingsStore.setState({
      aiDifficulty: "hard",
      matchSpeed: "fast",
    });

    return <SettingsPage />;
  },
};
