import type { Preview } from "@storybook/react-vite";

import "../src/app/styles/index.css";

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-[#070b12] p-8 text-white">
        <Story />
      </div>
    ),
  ],
  parameters: {
    backgrounds: {
      default: "draft-dark",
      values: [
        { name: "draft-dark", value: "#070b12" },
        { name: "pitch", value: "#0d3d24" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: "centered",
  },
};

export default preview;
