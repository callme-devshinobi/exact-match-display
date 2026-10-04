import { Link } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import logoIcon from "@/assets/earngage-icon.png.asset.json";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
          <img src={logoIcon.url} alt="EarnGage" className="h-10 w-10 object-contain" />
          EarnGage
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-muted-foreground">
          <Link to="/" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }}>
            Tasks
          </Link>
          <Link
            to="/manage"
            aria-label="Change promotional image"
            title="Change promotional image"
            className="grid h-9 w-9 place-items-center rounded-md transition-colors hover:bg-accent hover:text-foreground"
            activeProps={{ className: "bg-accent text-foreground" }}
          >
            <Settings className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}