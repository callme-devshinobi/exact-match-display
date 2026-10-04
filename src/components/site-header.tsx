import { Link } from "@tanstack/react-router";
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
        </nav>
      </div>
    </header>
  );
}
