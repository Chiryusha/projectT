import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  createMockDraftSessionState,
  mockCompletedDraftSessionState,
} from "../../testing/mockDraftState";
import OptionsPanel from "./OptionsPanel";

const meta = {
  component: OptionsPanel,
  decorators: [
    (Story) => (
      <div className="w-[1040px]">
        <Story />
      </div>
    ),
  ],
  title: "features/draft/OptionsPanel",
} satisfies Meta<typeof OptionsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PlayerPick: Story = {
  args: {
    disabled: false,
    onPick: () => undefined,
    sessionState: createMockDraftSessionState(),
  },
};

export const PickingDisabled: Story = {
  args: {
    ...PlayerPick.args,
    disabled: true,
  },
};

export const Completed: Story = {
  args: {
    disabled: false,
    onPick: () => undefined,
    sessionState: mockCompletedDraftSessionState,
  },
};
