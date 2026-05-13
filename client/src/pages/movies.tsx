import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { usePageXP } from "@/hooks/use-xp-track";
import { Search, Play, ChevronDown, ExternalLink } from "lucide-react";

const IMG = "https://biology.geography.drama.studying.math.mindboggle.us/images/episodes/";

const MOVIES = [
  { title: "Zootopia 2",                              img: "zootopia-2.jpg",               tmdb: 1241982 },
  { title: "Shrek",                                   img: "shrek.jpeg",                   tmdb: 808 },
  { title: "Shrek 2",                                 img: "shrek-2.jpeg",                 tmdb: 810 },
  { title: "Shrek 3",                                 img: "shrek-3.jpeg",                 tmdb: 812 },
  { title: "Shrek 4",                                 img: "shrek-4.jpeg",                 tmdb: 102651 },
  { title: "Interstellar",                            img: "interstellar.jpeg",            tmdb: 157336 },
  { title: "John Wick",                               img: "john-wick.jpeg",               tmdb: 245891 },
  { title: "John Wick 2",                             img: "john-wick-2.jpeg",             tmdb: 324552 },
  { title: "John Wick 3",                             img: "john-wick-3.jpeg",             tmdb: 458156 },
  { title: "John Wick 4",                             img: "john-wick-4.webp",             tmdb: 603692 },
  { title: "Home Team",                               img: "home-team.jpeg",               tmdb: 766503 },
  { title: "Twisters",                                img: "twisters.jpeg",                tmdb: 718821 },
  { title: "The Simpsons Movie",                      img: "the-simpsons-movie.jpg",       tmdb: 2989 },
  { title: "Whiplash",                                img: "whiplash.jpeg",                tmdb: 244786 },
  { title: "The Karate Kid",                          img: "the-karate-kid.jpg",           tmdb: 1885 },
  { title: "The Karate Kid 2",                        img: "the-karate-kid-2.webp",        tmdb: 1110001 },
  { title: "The Lego Batman Movie",                   img: "the-lego-batman-movie.jpg",    tmdb: 324849 },
  { title: "Sonic the Hedgehog",                      img: "sonic-the-hedgehog.jpg",       tmdb: 454626 },
  { title: "Sonic the Hedgehog 2",                    img: "sonic-the-hedgehog-2.jpg",     tmdb: 675353 },
  { title: "Harry Potter: Sorcerer's Stone",          img: "harry-potter-1.jpg",           tmdb: 671 },
  { title: "Harry Potter: Chamber of Secrets",        img: "harry-potter-2.jpg",           tmdb: 672 },
  { title: "Harry Potter: Prisoner of Azkaban",       img: "harry-potter-3.avif",          tmdb: 673 },
  { title: "Harry Potter: Goblet of Fire",            img: "harry-potter-4.avif",          tmdb: 674 },
  { title: "Harry Potter: Order of the Phoenix",      img: "harry-potter-5.jpg",           tmdb: 675 },
  { title: "Harry Potter: Half-Blood Prince",         img: "harry-potter-6.jpg",           tmdb: 767 },
  { title: "Harry Potter: Deathly Hallows Part 1",    img: "harry-potter-7-1.jpg",         tmdb: 12444 },
  { title: "Harry Potter: Deathly Hallows Part 2",    img: "harry-potter-7.jpg",           tmdb: 12445 },
  { title: "Indiana Jones: Last Crusade",             img: "indiana-jones-last-crusade.webp",   tmdb: 89 },
  { title: "Indiana Jones: Crystal Skull",            img: "indiana-jones-crystal-skull.png",   tmdb: 76170 },
  { title: "Indiana Jones: Temple of Doom",           img: "indiana-jones-temple-of-doom.jpg",  tmdb: 87 },
  { title: "Indiana Jones: Raiders of the Lost Ark",  img: "indiana-jones-lost-arc.jpg",        tmdb: 85 },
  { title: "Happy Gilmore",                           img: "happy-gilmore.jpg",            tmdb: 9614 },
  { title: "Happy Gilmore 2",                         img: "happy-gilmore-2.webp",         tmdb: 1233069 },
  { title: "The Matrix",                              img: "the-matrix.webp",              tmdb: 603 },
  { title: "The Outsiders",                           img: "the-outsiders.webp",           tmdb: 10008 },
  { title: "War of the Worlds",                       img: "war-of-the-worlds.jpeg",       tmdb: 74 },
  { title: "Oppenheimer",                             img: "oppenheimer.jpg",              tmdb: 872585 },
  { title: "IT",                                      img: "it.jpg",                       tmdb: 346364 },
  { title: "Back to the Future",                      img: "back-to-the-future.jpg",       tmdb: 105 },
  { title: "Matilda",                                 img: "matilda.jpg",                  tmdb: 9607 },
  { title: "The Sandlot",                             img: "the-sandlot.jpeg",             tmdb: 11050 },
  { title: "Star Wars: Attack of the Clones",         img: "star-wars-clones-attack.webp", tmdb: 1091 },
  { title: "Star Wars: Revenge of the Sith",          img: "star-wars-revenge-sith.jpg",   tmdb: 1895 },
  { title: "Star Wars: The Phantom Menace",           img: "star-wars-phantom-menace.jpg", tmdb: 1893 },
  { title: "Star Wars: Return of the Jedi",           img: "star-wars-return-jedi.jpg",    tmdb: 1892 },
  { title: "Star Wars: The Empire Strikes Back",      img: "star-wars-empire-back.jpg",    tmdb: 1891 },
  { title: "Star Wars: A New Hope",                   img: "star-wars-new-hope.jpg",       tmdb: 11 },
  { title: "Five Nights at Freddy's",                 img: "fnaf.webp",                    tmdb: 507089 },
  { title: "Five Nights at Freddy's 2",               img: "five-nights-at-freddys.jpg",   tmdb: 1049482 },
];

type Movie = typeof MOVIES[0];

function MovieCard({ movie, onPlay }: { movie: Movie; onPlay: () => void }) {
  return (
    <div
      className="group relative overflow-hidden rounded-lg cursor-pointer select-none bg-zinc-900"
      style={{ flex: "0 0 160px", width: 160, aspectRatio: "2/3" }}
      onClick={onPlay}
      data-testid={`movie-card-${movie.title.replace(/\s+/g, "-").toLowerCase()}`}
    >
      <img
        src={IMG + movie.img}
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

const SERVERS = [
  // Sources known to allow iframe embedding from external domains:
  { label: "VidSrc.to",        url: (id: number) => `https://vidsrc.to/embed/movie/${id}` },
  { label: "VidSrc.xyz",       url: (id: number) => `https://vidsrc.xyz/embed/movie/${id}` },
  { label: "VidSrc.me",        url: (id: number) => `https://vidsrc.me/embed/movie?tmdb=${id}` },
  { label: "VidSrc.cc",        url: (id: number) => `https://vidsrc.cc/embed/movie/${id}` },
  { label: "VidSrc.in",        url: (id: number) => `https://vidsrc.in/embed/movie/${id}` },
  { label: "Videasy",          url: (id: number) => `https://player.videasy.net/movie/${id}` },
  { label: "AutoEmbed",        url: (id: number) => `https://autoembed.to/movie/tmdb/${id}` },
  { label: "VidLink",          url: (id: number) => `https://vidlink.pro/movie/${id}` },
  { label: "Embed.su",         url: (id: number) => `https://embed.su/embed/movie/${id}` },
  { label: "Embed.im",         url: (id: number) => `https://embed.im/movie/${id}` },
  { label: "SuperEmbed",       url: (id: number) => `https://superembed.stream/movie/${id}` },
  { label: "MovieAPI",         url: (id: number) => `https://moviesapi.club/movie/${id}` },
  { label: "NontonGo",         url: (id: number) => `https://nontongo.club/embed/movie/${id}` },
  { label: "Multiembed",       url: (id: number) => `https://multiembed.cm/movie/${id}` },
  { label: "SmashyStream",     url: (id: number) => `https://smashystream.xyz/movie/${id}` },
  { label: "Blackvid",         url: (id: number) => `https://blackvid.space/embed/movie/${id}` },
  { label: "DrivePlayer",      url: (id: number) => `https://databasegdriveplayer.co/player.php?tmdb=${id}` },
  { label: "StreamHide",       url: (id: number) => `https://streamhide.to/movie/${id}` },
  { label: "Hexupload",        url: (id: number) => `https://hexupload.it/embed/movie/${id}` },
  { label: "VidCloud",         url: (id: number) => `https://vidcloud.stream/${id}.html` },
  { label: "Framer",           url: (id: number) => `https://framer.stream/movie/${id}` },
  { label: "2Embed",           url: (id: number) => `https://www.2embed.cc/embed/${id}` },
  { label: "VidKing",          url: (id: number) => `https://www.vidking.net/embed/movie/${id}?autoPlay=true` },
  // These may block iframe embedding — use "Open in Tab" if blocked:
  { label: "Viper",            url: (id: number) => `https://viper.to/embed/movie/${id}` },
  { label: "Viper (alt)",      url: (id: number) => `https://viper.su/embed/movie/${id}` },
];

function VideoPlayer({ movie, onClose }: { movie: Movie; onClose: () => void }) {
  const [server, setServer] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const playerSrc = SERVERS[server].url(movie.tmdb);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [dropdownOpen]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85"
      style={{ animation: "fadeInBg 0.25s ease" }}
      onClick={onClose}
      data-testid="video-player-overlay"
    >
      <style>{`
        @keyframes fadeInBg { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInModal { from { transform: translateY(24px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
      `}</style>

      <div
        className="relative flex flex-col bg-[#141414] rounded-sm overflow-hidden shadow-2xl"
        style={{
          width: "min(92vw, 1100px)",
          height: "min(92vh, 700px)",
          animation: "slideInModal 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={e => e.stopPropagation()}
        data-testid="video-player-modal"
      >
        <div className="flex items-center justify-between px-4 h-10 bg-[#1c1c1c] border-b border-white/[0.08] shrink-0">
          <h3 className="text-white/90 font-semibold text-sm tracking-wide truncate mr-3">{movie.title}</h3>

          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              data-testid="button-sources"
              className="flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded bg-purple-600/80 hover:bg-purple-600 text-white transition-colors"
            >
              Sources
              <ChevronDown className={`w-3 h-3 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-[#242424] border border-white/10 rounded-md shadow-xl z-10 py-1 min-w-[150px] max-h-64 overflow-y-auto">
                <div className="px-3 py-1 text-[10px] text-white/30 uppercase tracking-wider font-semibold sticky top-0 bg-[#242424]">Select Source</div>
                {SERVERS.map((s, i) => (
                  <button
                    key={i}
                    data-testid={`button-source-${i + 1}`}
                    onClick={() => { setServer(i); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                      server === i
                        ? "text-purple-400 bg-purple-600/10 font-medium"
                        : "text-white/70 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {server === i && <span className="mr-1.5">▸</span>}{s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a
            href={playerSrc}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="button-open-tab"
            className="flex items-center gap-1 text-[11px] font-medium px-3 py-1 rounded bg-zinc-700/80 hover:bg-zinc-600 text-white transition-colors ml-2 shrink-0"
            title="Open in new tab if content is blocked"
          >
            <ExternalLink className="w-3 h-3" />
            Open in Tab
          </a>

          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors ml-3 shrink-0 text-lg leading-none px-1"
            data-testid="button-close-player"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <iframe
          key={playerSrc}
          src={playerSrc}
          className="flex-1 w-full border-0 bg-black"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
          title={movie.title}
          data-testid="video-player-iframe"
        />
      </div>
    </div>,
    document.body
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
              <MovieCard key={movie.title} movie={movie} onPlay={() => setPlaying(movie)} />
            ))}
          </div>
        )}
      </div>

      {playing && <VideoPlayer movie={playing} onClose={handleClose} />}
    </div>
  );
}
