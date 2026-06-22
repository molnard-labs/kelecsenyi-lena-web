import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://kelecsenyilena.hu",
  integrations: [tailwind()],
  vite: {
    cacheDir: ".vite-build",
  },
});
