import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { ChangeEvent, useRef, useState } from "react";
import { ArrowLeft, CheckCircle2, Copy, ImagePlus, Link2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { promotionImageQuery } from "@/lib/promotion";
import { updatePromotionImage } from "@/lib/promotion.functions";
import { createShareLink, listShareLinks } from "@/lib/share-links.functions";
import fallbackImage from "@/assets/earngage-promotion.jpg";

const shareLinksQuery = queryOptions({
  queryKey: ["share-links"],
  queryFn: () => listShareLinks(),
});

export const Route = createFileRoute("/manage")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(promotionImageQuery),
      context.queryClient.ensureQueryData(shareLinksQuery),
    ]),
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

        <ShareLinks />
      </main>
    </div>
  );
}

function ShareLinks() {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(shareLinksQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    setError(null);
    if (!selected) return;
    if (!ALLOWED_TYPES.includes(selected.type)) return setError("Choose a JPG, PNG, or WebP image.");
    if (selected.size > MAX_SIZE) return setError("Choose an image smaller than 10 MB.");
    setBusy(true);
    try {
      const base64 = await readAsDataUrl(selected);
      await createShareLink({ data: { base64, contentType: selected.type as "image/jpeg" | "image/png" | "image/webp" } });
      await queryClient.invalidateQueries({ queryKey: shareLinksQuery.queryKey });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The share link could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (link: string) => {
    await navigator.clipboard.writeText(link);
    setCopied(link);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-extrabold text-foreground">Share links</h2>
      <p className="mt-1 text-muted-foreground">Upload an image to get its own Share &amp; Earn page with a unique link.</p>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPick} className="sr-only" />
      <Button className="mt-4 h-11" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : <Link2 />}
        {busy ? "Creating…" : "Upload image & create link"}
      </Button>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
      <ul className="mt-5 space-y-3">
        {data.links.map((item) => {
          const link = `${origin}/s/${item.id}`;
          return (
            <li key={item.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card">
              <img src={item.url} alt="" className="h-14 w-14 rounded-md object-cover" />
              <a href={`/s/${item.id}`} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:underline">{link}</a>
              <Button variant="outline" size="sm" onClick={() => copy(link)} aria-label="Copy link">
                {copied === link ? <CheckCircle2 /> : <Copy />}
              </Button>
            </li>
          );
        })}
        {data.links.length === 0 && <li className="text-sm text-muted-foreground">No share links yet.</li>}
      </ul>
    </section>
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