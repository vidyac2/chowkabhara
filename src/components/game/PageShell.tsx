import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageShell({ title, children, back = "/" }: { title: string; children: React.ReactNode; back?: "/" | "/play" }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-5 px-4 pb-10 pt-4 sm:px-6">
      <header className="flex items-center gap-3">
        <Button asChild variant="paper" size="icon-lg" aria-label="Back">
          <Link to={back}>
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-display text-4xl font-bold leading-none">{title}</h1>
      </header>
      {children}
    </main>
  );
}
