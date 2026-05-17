import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";

import { useAuthStore } from "@/features/auth";

import IntroductionPage from "./IntroductionPage";

const meta = {
  component: IntroductionPage,
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
  title: "pages/IntroductionPage",
} satisfies Meta<typeof IntroductionPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  render: () => {
    useAuthStore.setState({
      accessToken: null,
      error: null,
      refreshToken: null,
      status: "guest",
      user: null,
    });

    return <IntroductionPage />;
  },
};

export const Authenticated: Story = {
  render: () => {
    useAuthStore.setState({
      accessToken: "storybook-access-token",
      error: null,
      refreshToken: "storybook-refresh-token",
      status: "authenticated",
      user: {
        avatarUrl: null,
        email: "demo@futdraft.local",
        id: "storybook-user-id",
        nickname: "demo_user",
      },
    });

    return <IntroductionPage />;
  },
};
