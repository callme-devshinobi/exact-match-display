import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "promotional-images";
const FOLDER = "links";
const idSchema = z.string().regex(/^[a-z0-9]{6,16}$/);
const targetSchema = z
  .string()
  .trim()
  .max(2000)
  .regex(/^https?:\/\/\S+$/i, "Enter a link starting with http:// or https://");

const uploadSchema = z.object({
  base64: z.string().max(14_000_000),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  targetUrl: targetSchema.optional(),
});

const targetInputSchema = z.object({
  id: idSchema,
  // Empty string clears the destination link.
  targetUrl: targetSchema.or(z.literal("")),
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
    if (data.targetUrl) {
      const { error: targetError } = await supabaseAdmin
        .from("share_links")
        .insert({ id, target_url: data.targetUrl });
      if (targetError) {
        await supabaseAdmin.storage.from(BUCKET).remove([`${FOLDER}/${id}`]);
        throw new Error("The share link could not be created. Please try again.");
      }
    }
    return { id };
  });

export const setShareLinkTarget = createServerFn({ method: "POST" })
  .inputValidator((data) => targetInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.targetUrl === "") {
      const { error } = await supabaseAdmin.from("share_links").delete().eq("id", data.id);
      if (error) throw new Error("The destination link could not be saved.");
      return { targetUrl: null };
    }
    const { error } = await supabaseAdmin
      .from("share_links")
      .upsert({ id: data.id, target_url: data.targetUrl });
    if (error) throw new Error("The destination link could not be saved.");
    return { targetUrl: data.targetUrl };
  });

export const getShareLinkImage = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: idSchema }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(`${FOLDER}/${data.id}`, 60 * 60);
    if (error) return { url: null, targetUrl: null };
    const { data: row } = await supabaseAdmin
      .from("share_links")
      .select("target_url")
      .eq("id", data.id)
      .maybeSingle();
    return { url: signed.signedUrl, targetUrl: row?.target_url ?? null };
  });

export const listShareLinks = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(FOLDER, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
  if (error || !data) return { links: [] as { id: string; url: string; targetUrl: string | null }[] };
  const ids = data.map((f) => f.name).filter((n) => idSchema.safeParse(n).success);
  if (ids.length === 0) return { links: [] as { id: string; url: string; targetUrl: string | null }[] };
  const [{ data: signed }, { data: rows }] = await Promise.all([
    supabaseAdmin.storage.from(BUCKET).createSignedUrls(ids.map((id) => `${FOLDER}/${id}`), 60 * 60),
    supabaseAdmin.from("share_links").select("id, target_url").in("id", ids),
  ]);
  const targets = new Map((rows ?? []).map((row) => [row.id, row.target_url]));
  return {
    links: ids.map((id, i) => ({
      id,
      url: signed?.[i]?.signedUrl ?? "",
      targetUrl: targets.get(id) ?? null,
    })),
  };
});
