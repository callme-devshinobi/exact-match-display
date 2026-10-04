import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ChangeEvent, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { promotionImageQuery } from "@/lib/promotion";
import { updatePromotionImage } from "@/lib/promotion.functions";
import fallbackImage from "@/assets/earngage-promotion.jpg";

export const Route = createFileRoute("/manage")({
  loader: ({ context }) => context.queryClient.ensureQueryData(promotionImageQuery),
  head: () => ({
    meta: [
      { title: "Change Promotion Image — EarnGage" },
      { name: "description", content: "Upload and replace the current EarnGage promotional image." },
      { property: "og:title", content: "Change Promotion Image — EarnGage" },
      { property: "og:description", content: "Manage the current EarnGage promotional image." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ManagePromotion,
});

const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function ManagePromotion() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(promotionImageQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setError(null);
    setMessage(null);
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const saveImage = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const base64 = await readAsDataUrl(file);
      const result = await updatePromotionImage({ data: { base64, contentType: file.type as "image/jpeg" | "image/png" | "image/webp" } });
      queryClient.setQueryData(promotionImageQuery.queryKey, { url: result.url });
      setMessage("Promotion image updated successfully.");
      setFile(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The image could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to task
        </Link>
        <h1 className="text-3xl font-extrabold text-foreground sm:text-4xl">Change promotion image</h1>
        <p className="mt-2 text-muted-foreground">Choose the image people will download and share.</p>

        <section className="mt-8 overflow-hidden rounded-lg border border-border bg-card shadow-card">
          <div className="aspect-square bg-muted p-3 sm:p-4">
            <img src={preview ?? data.url ?? fallbackImage} alt="Current promotional image preview" className="h-full w-full rounded-md object-contain" />
          </div>
          <div className="space-y-4 border-t border-border p-5">
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={selectFile} className="sr-only" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" className="h-11 flex-1" onClick={() => inputRef.current?.click()}>
                <ImagePlus /> Choose image
              </Button>
              <Button className="h-11 flex-1" onClick={saveImage} disabled={!file || saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Upload />}
                {saving ? "Saving…" : "Save image"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">JPG, PNG, or WebP. Maximum 10 MB.</p>
            {message && <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary"><CheckCircle2 className="h-4 w-4" />{message}</p>}
            {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
          </div>
        </section>
      </main>
    </div>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The selected image could not be read."));
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(file);
  });
}