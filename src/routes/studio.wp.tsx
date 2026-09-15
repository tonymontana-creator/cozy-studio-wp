import { createFileRoute } from "@tanstack/react-router";
import { WpStudio } from "@/components/studio/wp/WpStudio";

export const Route = createFileRoute("/studio/wp")({
  component: WpStudioPage,
  ssr: false,
  head: () => ({
    meta: [{ title: "WordPress Studio — Cozy AI Studio" }],
  }),
});

function WpStudioPage() {
  return <WpStudio />;
}
