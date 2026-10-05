import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "promotional-images";
const FOLDER = "links";
const idSchema = z.string().regex(/^[a-z0-9]{6,16}$/);

const uploadSchema = z.object({
  base64: z.string().max(14_000_000),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export const createShareLink = createServerFn({ method: "POST" })
  .inputValidator((data) => uploadSchema.parse(data))
  .handler(async ({ data }) => {
    const encoded = data.base64.split(",").pop();
    if (!encoded) throw new Error("The selected image could not be read.");
    const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(`${FOLDER}/${id}`, bytes, { contentType: data.contentType });
    if (error) throw new Error("The share link could not be created. Please try again.");
    return { id };
  });

export const getShareLinkImage = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: idSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(`${FOLDER}/${data.id}`, 60 * 60);
    if (error) return { url: null };
    return { url: signed.signedUrl };
  });

export const listShareLinks = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(FOLDER, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  if (error || !data) return { links: [] as { id: string; url: string }[] };
  const ids = data.map((f) => f.name).filter((n) => idSchema.safeParse(n).success);
  if (ids.length === 0) return { links: [] };
  const { data: signed } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrls(ids.map((id) => `${FOLDER}/${id}`), 60 * 60);
  return {
    links: ids.map((id, i) => ({ id, url: signed?.[i]?.signedUrl ?? "" })),
  };
});
