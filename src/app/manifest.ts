import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Easy Grocer",
    short_name: "EasyGrocer",
    description:
      "Plan weekly meals and send groceries to Walmart based on your goals.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1020",
    theme_color: "#0f172a",
    orientation: "portrait",
    icons: [
      {
        src: "/next.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
