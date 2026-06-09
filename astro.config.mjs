import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://lenakelecsenyi.hu",
  integrations: [tailwind()],
  vite: {
    cacheDir: ".vite-build",
  },
});
