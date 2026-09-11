import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Web3 Hunting OS",
    short_name: "Hunting OS",
    description: "A private workspace for Web3 hunting activities.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0f0f11",
    theme_color: "#0f0f11",
    categories: ["productivity", "utilities"],
    icons: [
      {
        src: "/icons/web3-hunting-os-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/web3-hunting-os-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/web3-hunting-os-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/web3-hunting-os-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Web3 Hunting OS sign-in screen",
      },
      {
        src: "/screenshots/web3-hunting-os-mobile.png",
        sizes: "390x844",
        type: "image/png",
        label: "Web3 Hunting OS mobile sign-in screen",
      },
    ],
    shortcuts: [
      {
        name: "Projects",
        short_name: "Projects",
        url: "/projects",
        description: "Open the project database.",
        icons: [{ src: "/icons/web3-hunting-os-shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Tasks",
        short_name: "Tasks",
        url: "/tasks",
        description: "Open cross-project tasks.",
        icons: [{ src: "/icons/web3-hunting-os-shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
      {
        name: "Daily",
        short_name: "Daily",
        url: "/daily",
        description: "Open the daily checklist.",
        icons: [{ src: "/icons/web3-hunting-os-shortcut-96.png", sizes: "96x96", type: "image/png" }],
      },
    ],
  };
}
