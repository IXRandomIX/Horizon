import { usePageXP } from "@/hooks/use-xp-track";

export default function MoviesPage() {
  usePageXP("movies_visited");

  return (
    <div className="h-full w-full overflow-hidden">
      <iframe
        src="/api/movies/movpage"
        className="w-full h-full border-0"
        allowFullScreen
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
        data-testid="iframe-movies"
        title="Movies"
      />
    </div>
  );
}
