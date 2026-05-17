import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";

import { useAuthStore } from "@/features/auth";

import RegisterPage from "./RegisterPage";

const mockUser = {
  email: "draft_boss@example.com",
  id: "user-id",
  nickname: "draft_boss",
};

const setRegisterState = () => {
  useAuthStore.setState({
    accessToken: null,
    clearError: () => useAuthStore.setState({ error: null }),
    error: null,
    refreshToken: null,
    register: async () => mockUser,
    status: "guest",
    user: null,
  });
};

const meta = {
  component: RegisterPage,
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
  title: "pages/RegisterPage",
} satisfies Meta<typeof RegisterPage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    setRegisterState();

    return <RegisterPage />;
  },
};
