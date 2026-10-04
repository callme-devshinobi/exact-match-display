import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BUCKET = "promotional-images";
const OBJECT_PATH = "current-promotion";

export const getPromotionImage = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(OBJECT_PATH, 60 * 60);

  if (error) return { url: null };
  return { url: data.signedUrl };
});

const uploadSchema = z.object({
  base64: z.string().max(14_000_000),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

export const updatePromotionImage = createServerFn({ method: "POST" })
  .inputValidator((data) => uploadSchema.parse(data))
  .handler(async ({ data }) => {
    const encoded = data.base64.split(",").pop();
    if (!encoded) throw new Error("The selected image could not be read.");

    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(OBJECT_PATH, bytes, {
      contentType: data.contentType,
      upsert: true,
    });

    if (error) throw new Error("The image could not be saved. Please try again.");

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(OBJECT_PATH, 60 * 60);
    if (signedError) throw new Error("The image was saved but its preview could not be loaded.");
    return { url: signed.signedUrl };
  });