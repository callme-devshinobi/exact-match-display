import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Facebook, Coins, Loader2 } from "lucide-react";
// Replace this import to change the promotional image.
import promoImage from "@/assets/earngage-promotion.jpg";

const DOWNLOAD_FILENAME = "earngage-promotion.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Share & Earn — EarnGage" },
      { name: "description", content: "Download the EarnGage promo image or share it to Facebook to earn rewards." },
      { property: "og:title", content: "Share & Earn — EarnGage" },
      { property: "og:description", content: "Share this EarnGage promotion on Facebook and earn rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(promoImage);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = DOWNLOAD_FILENAME;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      window.open(promoImage, "_blank", "noopener");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=640,height=600");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Coins className="h-5 w-5" />
            </span>
            EarnGage
          </a>
          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="/" className="text-foreground">Tasks</a>
            <a href="/" className="hidden hover:text-foreground sm:inline">Rewards</a>
            <a href="/" className="hover:text-foreground">Help</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
        <div className="text-center">
          <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
            Active task
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Share &amp; Earn</h1>
          <p className="mt-2 text-muted-foreground">Download the image or share it directly to Facebook.</p>
        </div>

        <section className="mt-8 rounded-3xl border border-border bg-card p-3 shadow-card sm:p-4">
          <img
            src={promoImage}
            alt="EarnGage Share & Earn promotional image"
            className="w-full rounded-2xl"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleDownload}
              disabled={downloading}
              aria-label="Download promotional image"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-5 py-3.5 font-semibold text-secondary-foreground transition hover:bg-muted active:scale-[0.98] disabled:opacity-70"
            >
              {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              Download Image
            </button>
            <button
              onClick={handleShare}
              aria-label="Share this page to Facebook"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-facebook px-5 py-3.5 font-semibold text-facebook-foreground shadow-soft transition hover:brightness-110 active:scale-[0.98]"
            >
              <Facebook className="h-5 w-5" fill="currentColor" strokeWidth={0} />
              Share to Facebook
            </button>
          </div>
        </section>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          After sharing, take a screenshot of your Facebook post as proof.
        </p>
      </main>
    </div>
  );
}
