import { defineConfig } from 'wxt';
import solid from "vite-plugin-solid";

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    permissions: ["storage"]
  },
  extensionApi: 'chrome',
  vite: () => ({
    plugins: [solid()]
  }),
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: "assets/icon.svg"
  }
});
