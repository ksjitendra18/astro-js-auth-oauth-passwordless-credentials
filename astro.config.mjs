import { defineConfig, fontProviders } from "astro/config";
import vercel from "@astrojs/vercel";
import solidJs from "@astrojs/solid-js";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [solidJs()],
  vite: {
    plugins: [tailwindcss()],
  },
  security: {
    checkOrigin: true,
  },
  experimental: {
    fonts: [
      {
        provider: fontProviders.google(),
        name: "Inter",
        cssVariable: "--font-inter",
        subsets: ["latin"],
      },
    ],
  },
});
