import { createFileRoute } from "@tanstack/react-router";

const BUCKET = "promotional-images";
const FOLDER = "links";

export const Route = createFileRoute("/api/public/og-image/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!/^[a-z0-9]{6,16}$/.test(id)) {
          return new Response("Not found", { status: 404 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from(BUCKET)
          .download(`${FOLDER}/${id}`);
        if (error || !data) return new Response("Not found", { status: 404 });
        return new Response(data, {
          headers: {
            "Content-Type": data.type || "image/jpeg",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
