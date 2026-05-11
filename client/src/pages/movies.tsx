import { useState, useEffect, useCallback } from "react";
import { usePageXP } from "@/hooks/use-xp-track";
import { X, Search, Play } from "lucide-react";

const BASE = "https://biology.geography.drama.studying.math.mindboggle.us/images/episodes/";
const PLAYER = "https://biology.geography.drama.studying.math.mindboggle.us/bill-nye-old.html";

const MOVIES = [
  { id: 1,  title: "Zootopia 2",                               img: "zootopia-2.jpg" },
  { id: 2,  title: "Shrek",                                    img: "shrek.jpeg" },
  { id: 3,  title: "Shrek 2",                                  img: "shrek-2.jpeg" },
  { id: 4,  title: "Shrek 3",                                  img: "shrek-3.jpeg" },
  { id: 5,  title: "Shrek 4",                                  img: "shrek-4.jpeg" },
  { id: 6,  title: "Interstellar",                             img: "interstellar.jpeg" },
  { id: 7,  title: "John Wick",                                img: "john-wick.jpeg" },
  { id: 8,  title: "John Wick 2",                              img: "john-wick-2.jpeg" },
  { id: 9,  title: "John Wick 3",                              img: "john-wick-3.jpeg" },
  { id: 10, title: "John Wick 4",                              img: "john-wick-4.webp" },
  { id: 11, title: "Home Team",                                img: "home-team.jpeg" },
  { id: 12, title: "Twisters",                                 img: "twisters.jpeg" },
  { id: 13, title: "The Simpsons Movie",                       img: "the-simpsons-movie.jpg" },
  { id: 14, title: "Whiplash",                                 img: "whiplash.jpeg" },
  { id: 15, title: "The Karate Kid",                           img: "the-karate-kid.jpg" },
  { id: 16, title: "The Karate Kid 2",                         img: "the-karate-kid-2.webp" },
  { id: 17, title: "The Lego Batman Movie",                    img: "the-lego-batman-movie.jpg" },
  { id: 18, title: "Sonic the Hedgehog",                       img: "sonic-the-hedgehog.jpg" },
  { id: 19, title: "Sonic the Hedgehog 2",                     img: "sonic-the-hedgehog-2.jpg" },
  { id: 20, title: "Harry Potter: Sorcerer's Stone",           img: "harry-potter-1.jpg" },
  { id: 21, title: "Harry Potter: Chamber of Secrets",        img: "harry-potter-2.jpg" },
  { id: 22, title: "Harry Potter: Prisoner of Azkaban",       img: "harry-potter-3.avif" },
  { id: 23, title: "Harry Potter: Goblet of Fire",            img: "harry-potter-4.avif" },
  { id: 24, title: "Harry Potter: Order of the Phoenix",      img: "harry-potter-5.jpg" },
  { id: 25, title: "Harry Potter: Half-Blood Prince",         img: "harry-potter-6.jpg" },
  { id: 26, title: "Harry Potter: Deathly Hallows Part 1",    img: "harry-potter-7-1.jpg" },
  { id: 27, title: "Harry Potter: Deathly Hallows Part 2",    img: "harry-potter-7.jpg" },
  { id: 28, title: "Indiana Jones: Last Crusade",             img: "indiana-jones-last-crusade.webp" },
  { id: 29, title: "Indiana Jones: Crystal Skull",            img: "indiana-jones-crystal-skull.png" },
  { id: 30, title: "Indiana Jones: Temple of Doom",           img: "indiana-jones-temple-of-doom.jpg" },
  { id: 31, title: "Indiana Jones: Raiders of the Lost Ark",  img: "indiana-jones-lost-arc.jpg" },
  { id: 32, title: "Happy Gilmore",                           img: "happy-gilmore.jpg" },
  { id: 33, title: "Happy Gilmore 2",                         img: "happy-gilmore-2.webp" },
  { id: 34, title: "The Matrix",                              img: "the-matrix.webp" },
  { id: 35, title: "The Outsiders",                           img: "the-outsiders.webp" },
  { id: 36, title: "War of the Worlds",                       img: "war-of-the-worlds.jpeg" },
  { id: 37, title: "Oppenheimer",                             img: "oppenheimer.jpg" },
  { id: 38, title: "IT",                                      img: "it.jpg" },
  { id: 39, title: "Back to the Future",                      img: "back-to-the-future.jpg" },
  { id: 40, title: "Matilda",                                 img: "matilda.jpg" },
  { id: 41, title: "The Sandlot",                             img: "the-sandlot.jpeg" },
  { id: 42, title: "Star Wars: Attack of the Clones",         img: "star-wars-clones-attack.webp" },
  { id: 43, title: "Star Wars: Revenge of the Sith",          img: "star-wars-revenge-sith.jpg" },
  { id: 44, title: "Star Wars: The Phantom Menace",           img: "star-wars-phantom-menace.jpg" },
  { id: 45, title: "Star Wars: Return of the Jedi",           img: "star-wars-return-jedi.jpg" },
  { id: 46, title: "Star Wars: The Empire Strikes Back",      img: "star-wars-empire-back.jpg" },
  { id: 47, title: "Star Wars: A New Hope",                   img: "star-wars-new-hope.jpg" },
  { id: 48, title: "Five Nights at Freddy's",                 img: "fnaf.webp" },
  { id: 49, title: "Five Nights at Freddy's 2",               img: "five-nights-at-freddys.jpg" },
];

type Movie = typeof MOVIES[0];

function MovieCard({ movie, onPlay }: { movie: Movie; onPlay: () => void }) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg cursor-pointer select-none bg-zinc-900"
      style={{ flex: "0 0 160px", width: 160, aspectRatio: "2/3" }}
      onClick={onPlay}
      data-testid={`movie-card-${movie.id}`}
    >
      <img
        src={BASE + movie.img}
        alt={movie.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
        loading="lazy"
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <p
        className="absolute left-0 right-0 bottom-0 text-white text-[11px] font-semibold px-2 pb-2 pt-5 text-center
                   translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                   transition-all duration-300 pointer-events-none leading-tight"
        style={{ textShadow: "0 0 8px #000" }}
      >
        {movie.title}
      </p>

      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-black/60 rounded-full p-3">
          <Play className="w-5 h-5 text-white fill-white" />
        </div>
      </div>
    </div>
  );
}

function VideoPlayer({ movie, onClose }: { movie: Movie; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const playerUrl = `${PLAYER}?id=${movie.id}`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      style={{ animation: "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)" }}
      data-testid="video-player-overlay"
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      <div className="flex items-center justify-between px-4 h-11 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <h3 className="text-white font-semibold text-sm truncate">{movie.title}</h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors ml-4 shrink-0 p-1"
          data-testid="button-close-player"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <iframe
        src={playerUrl}
        className="flex-1 w-full border-0 bg-black"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        title={movie.title}
        data-testid="video-player-iframe"
      />
    </div>
  );
}

export default function MoviesPage() {
  usePageXP("movies_visited");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<Movie | null>(null);

  const filtered = MOVIES.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleClose = useCallback(() => setPlaying(null), []);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0d0d0d] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-4xl font-bold mb-1 tracking-tight bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
          Horizon Movies
        </h1>
        <p className="text-zinc-500 text-sm mb-6">{MOVIES.length} films available</p>

        <div className="relative mb-8 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder='Search — try "Shrek", "Harry Potter"…'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            data-testid="input-movie-search"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-sm">No movies match your search.</p>
        ) : (
          <div className="flex flex-wrap gap-4" data-testid="movies-grid">
            {filtered.map(movie => (
              <MovieCard key={movie.id} movie={movie} onPlay={() => setPlaying(movie)} />
            ))}
          </div>
        )}
      </div>

      {playing && <VideoPlayer movie={playing} onClose={handleClose} />}
    </div>
  );
}
