import type { Meta, StoryObj } from "@storybook/react-vite";

import Loader from "./Loader";

const meta = {
  component: Loader,
  parameters: {
    visualTest: {
      skip: true,
    },
  },
  tags: ["skip-visual"],
  title: "shared/Loader",
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  args: {
    fullScreen: false,
  },
};
