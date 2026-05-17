import type { Meta, StoryObj } from "@storybook/react-vite";

import { mockFormation } from "@/shared/testing/mockDraftData";

import FormationPreview from "./FormationPreview";

const meta = {
  component: FormationPreview,
  decorators: [
    (Story) => (
      <div className="w-[520px]">
        <Story />
      </div>
    ),
  ],
  title: "entities/formation/FormationPreview",
} satisfies Meta<typeof FormationPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FourThreeThree: Story = {
  args: {
    formation: mockFormation,
  },
};

export const FiveThreeTwo: Story = {
  args: {
    formation: {
      ...mockFormation,
      code: "5-3-2",
      lineupSlots: ["GK", "RWB", "CB", "CB", "CB", "LWB", "CM", "CM", "CM", "ST", "ST"],
      name: "5-3-2 Compact",
    },
  },
};
