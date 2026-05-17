import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router-dom";

import {
  mockFormation,
  mockFormations,
} from "@/shared/testing/mockDraftData";

import FormationSelection from "./FormationSelection";

const meta = {
  component: FormationSelection,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="w-[1280px]">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  title: "features/draft/FormationSelection",
} satisfies Meta<typeof FormationSelection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    formations: mockFormations,
    onCreate: () => undefined,
    onSelect: () => undefined,
    selectedFormation: mockFormation,
    status: "idle",
  },
};

export const CreatingSession: Story = {
  args: {
    ...Idle.args,
    status: "creating",
  },
};
