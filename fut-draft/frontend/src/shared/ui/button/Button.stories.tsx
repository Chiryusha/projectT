import type { Meta, StoryObj } from "@storybook/react-vite";

import Button from "./Button";

const meta = {
  component: Button,
  title: "shared/Button",
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Начать драфт",
    className:
      "h-12 rounded-[8px] bg-lime-300 px-8 text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_24px_rgba(190,242,100,0.24)]",
  },
};

export const Secondary: Story = {
  args: {
    children: "Назад",
    className:
      "h-12 rounded-[8px] border border-white/15 px-8 text-sm font-black uppercase tracking-[0.14em] text-white",
  },
};
