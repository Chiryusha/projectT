import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";

import { useAuthStore } from "@/features/auth";

import LoginPage from "./LoginPage";

const mockUser = {
  email: "demo@futdraft.local",
  id: "user-id",
  nickname: "demo_user",
};

const setLoginState = () => {
  useAuthStore.setState({
    accessToken: null,
    clearError: () => useAuthStore.setState({ error: null }),
    error: null,
    login: async () => mockUser,
    refreshToken: null,
    status: "guest",
    user: null,
  });
};

const meta = {
  component: LoginPage,
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
  title: "pages/LoginPage",
} satisfies Meta<typeof LoginPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    setLoginState();

    return <LoginPage />;
  },
};
