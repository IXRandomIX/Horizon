import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePageXP } from "@/hooks/use-xp-track";
import { Search, Play } from "lucide-react";

const IMG = "https://biology.geography.drama.studying.math.mindboggle.us/images/episodes/";

const MOVIES = [
  { title: "Zootopia 2",                              img: "zootopia-2.jpg",               url: "https://canvas.instructure.com/files/6936~44365493/download?download_frd=1&verifier=zYUDHBZwJ6nWmMAE6Z9tWoRuOZXXxC0Bq7l4O0YM" },
  { title: "Shrek",                                   img: "shrek.jpeg",                   url: "https://canvas.instructure.com/files/6936~44388897/download?download_frd=1&verifier=MvARGOnKCU9C3F6vuOs0CyBPVl32ej8xBQlRgXYO" },
  { title: "Shrek 2",                                 img: "shrek-2.jpeg",                 url: "https://canvas.instructure.com/files/6936~44386173/download?download_frd=1&verifier=Cetd6XyRZAMqQm3wiYOyy3n0VN988WH5TYZukCya" },
  { title: "Shrek 3",                                 img: "shrek-3.jpeg",                 url: "https://canvas.instructure.com/files/6936~44386174/download?download_frd=1&verifier=lc5GxcD0IHQ6oVXvQ3hUzFXdIjZZ5IkupKFJthQD" },
  { title: "Shrek 4",                                 img: "shrek-4.jpeg",                 url: "https://canvas.instructure.com/files/6936~44386170/download?download_frd=1&verifier=VWT81usNqEg8v91f11lUOW8LMnxKiAkaeHis9ifY" },
  { title: "Interstellar",                            img: "interstellar.jpeg",            url: "https://canvas.instructure.com/files/6936~44391184/download?download_frd=1&verifier=CotCKyrd0BnrkgNF5HiMkHKhsepoOKYZipYDnayT" },
  { title: "John Wick",                               img: "john-wick.jpeg",               url: "https://canvas.instructure.com/files/6936~44391317/download?download_frd=1&verifier=FWozOuc8kCEe78MngfnRsSfC4vFGtLGwu8O9RJXr" },
  { title: "John Wick 2",                             img: "john-wick-2.jpeg",             url: "https://canvas.instructure.com/files/6936~44398495/download?download_frd=1&verifier=i5gwc1H1Ocm1TGG4936yFwwBg9tOUf7i77sAQrMI" },
  { title: "John Wick 3",                             img: "john-wick-3.jpeg",             url: "https://canvas.instructure.com/files/6936~44398539/download?download_frd=1&verifier=NdOAheaQ9nRTeF4rbhsqElKWHE4vtulDQi4HrvO7" },
  { title: "John Wick 4",                             img: "john-wick-4.webp",             url: "https://canvas.instructure.com/files/6936~44398585/download?download_frd=1&verifier=HvVhS52Eul4svdnW7q5ThUMRqbXdouFv0QIetRON" },
  { title: "Home Team",                               img: "home-team.jpeg",               url: "https://canvas.instructure.com/files/6936~44406952/download?download_frd=1&verifier=9R8UucBusdUScWblBBYVXRWCiKp1NkR1Z0lZbAts" },
  { title: "Twisters",                                img: "twisters.jpeg",                url: "https://canvas.instructure.com/files/6936~44410719/download?download_frd=1&verifier=8gC2u2XyahBGqEPnyhAfj8z521Wo3viFmInLRv9Q" },
  { title: "The Simpsons Movie",                      img: "the-simpsons-movie.jpg",       url: "https://canvas.instructure.com/files/334517367/download?download_frd=1&verifier=IVwwgUzBRSJEm61EL6yZqQ532bfpjoi1Vv1yiosp" },
  { title: "Whiplash",                                img: "whiplash.jpeg",                url: "https://canvas.instructure.com/files/335024839/download?download_frd=1&verifier=HECuTstyDHNDwITL0y83P1PgP7863K0qKGZMf9SM" },
  { title: "The Karate Kid",                          img: "the-karate-kid.jpg",           url: "https://canvas.instructure.com/files/336194149/download?download_frd=1&verifier=ZScQUPRsFl4DlIX8tyy1D193d555HZ4bePWgLHZ5" },
  { title: "The Karate Kid 2",                        img: "the-karate-kid-2.webp",        url: "https://canvas.instructure.com/files/336194061/download?download_frd=1&verifier=ebUrjSmADnsu6TSxtlQ33rkbnLgi1phgNkO40psh" },
  { title: "The Lego Batman Movie",                   img: "the-lego-batman-movie.jpg",    url: "https://canvas.instructure.com/files/336195933/download?download_frd=1&verifier=W40hzK5JFGnsi6qMwi7YbrUVMQVwaRB54pKvwL9K" },
  { title: "Sonic the Hedgehog",                      img: "sonic-the-hedgehog.jpg",       url: "https://canvas.instructure.com/files/336194121/download?download_frd=1&verifier=KKOI6nHYBTY0S9RWG7vt7ntCBkqPw7khc4TCgz8I" },
  { title: "Sonic the Hedgehog 2",                    img: "sonic-the-hedgehog-2.jpg",     url: "https://canvas.instructure.com/files/336194499/download?download_frd=1&verifier=Z57akm29JNwS5UiY2ggZGZcqBTMlxvs2ldlPbPZL" },
  { title: "Harry Potter: Sorcerer's Stone",          img: "harry-potter-1.jpg",           url: "https://canvas.instructure.com/files/336353613/download?download_frd=1&verifier=gLeLZUinsDCE9CxspkF4AS4Axl2rpqELE8HhGhra" },
  { title: "Harry Potter: Chamber of Secrets",        img: "harry-potter-2.jpg",           url: "https://canvas.instructure.com/files/336353615/download?download_frd=1&verifier=IOgxEpzL2ZrdZZqAHoJyplkQGKc6JXyQ7j27pGDk" },
  { title: "Harry Potter: Prisoner of Azkaban",       img: "harry-potter-3.avif",          url: "https://canvas.instructure.com/files/336353683/download?download_frd=1&verifier=QaEWVI4az1wQM9AYBkHAjay6LILK0lZsvqRetrGr" },
  { title: "Harry Potter: Goblet of Fire",            img: "harry-potter-4.avif",          url: "https://canvas.instructure.com/files/336353649/download?download_frd=1&verifier=HNv5BvVNevSKZgHKmY5oSc8NOhBT7Wt3VYDPBmhA" },
  { title: "Harry Potter: Order of the Phoenix",      img: "harry-potter-5.jpg",           url: "https://canvas.instructure.com/files/336353445/download?download_frd=1&verifier=NQ9Gy3gLnR3g1aXhIkcDJ3fniaxa0gtEo6EKXC2k" },
  { title: "Harry Potter: Half-Blood Prince",         img: "harry-potter-6.jpg",           url: "https://canvas.instructure.com/files/336353239/download?download_frd=1&verifier=tPmOncG5hPAik92zu2lzoi2lIImp7hvn8TWzVNEW" },
  { title: "Harry Potter: Deathly Hallows Part 1",    img: "harry-potter-7-1.jpg",         url: "https://canvas.instructure.com/files/336353041/download?download_frd=1&verifier=4TCIqO16sCHtagTSZwiYOxyVlQcvCtGvsbMSQOqt" },
  { title: "Harry Potter: Deathly Hallows Part 2",    img: "harry-potter-7.jpg",           url: "https://canvas.instructure.com/files/336353283/download?download_frd=1&verifier=Hacx1TMvAlNRB3xX1eiZadjew3wY9U4kOuDQOv4C" },
  { title: "Indiana Jones: Last Crusade",             img: "indiana-jones-last-crusade.webp",   url: "https://canvas.instructure.com/files/336353597/download?download_frd=1&verifier=urHOBw6RBWmsa2ft7Tmd8zZdkTpqlyJoUzoD6Ic1" },
  { title: "Indiana Jones: Crystal Skull",            img: "indiana-jones-crystal-skull.png",   url: "https://canvas.instructure.com/files/336353571/download?download_frd=1&verifier=CamVNBreTvagVWhuDJv1enoCuuzv5wSMQn3dmLpt" },
  { title: "Indiana Jones: Temple of Doom",           img: "indiana-jones-temple-of-doom.jpg",  url: "https://canvas.instructure.com/files/336353519/download?download_frd=1&verifier=JFRbW4QtKk6nCkSe3883kQRNwR78J5K8533sIJ5y" },
  { title: "Indiana Jones: Raiders of the Lost Ark",  img: "indiana-jones-lost-arc.jpg",        url: "https://canvas.instructure.com/files/336353503/download?download_frd=1&verifier=DrjJn6HI0Q8NnxMoDiQ2hHlELsWVQ4zpx6Q7fOjT" },
  { title: "Happy Gilmore",                           img: "happy-gilmore.jpg",            url: "https://canvas.instructure.com/files/336353391/download?download_frd=1&verifier=FKZTQs2gmy3U6JJ369W2WRg4f7PCKBK5DHbnx8Qj" },
  { title: "Happy Gilmore 2",                         img: "happy-gilmore-2.webp",         url: "https://canvas.instructure.com/files/336353515/download?download_frd=1&verifier=E6ciOBxCD8PudDUNHkOi3m091XdxOvRE6KmjjPTU" },
  { title: "The Matrix",                              img: "the-matrix.webp",              url: "https://canvas.instructure.com/files/336353499/download?download_frd=1&verifier=zNIbcrC2mihTdVgnjVOJtvRITwxmOsJcpHhf67pe" },
  { title: "The Outsiders",                           img: "the-outsiders.webp",           url: "https://canvas.instructure.com/files/336353497/download?download_frd=1&verifier=NcTIh7B6UhbuyNNdpXxHrfnDslvJpkLb8kZI5FND" },
  { title: "War of the Worlds",                       img: "war-of-the-worlds.jpeg",       url: "https://canvas.instructure.com/files/336353479/download?download_frd=1&verifier=MAj5gRjOjc5xWxcqcAAJNGBpboitXghLAcbvhM41" },
  { title: "Oppenheimer",                             img: "oppenheimer.jpg",              url: "https://canvas.instructure.com/files/336353463/download?download_frd=1&verifier=Vn7XeHD3kRxjMmDWdQFYQJ8BUzdzx5eceBjlAqTl" },
  { title: "IT",                                      img: "it.jpg",                       url: "https://canvas.instructure.com/files/336353379/download?download_frd=1&verifier=nmFpqJHeqiYC70TLWEnFJ9vSC5ADyS4VSyxHy3Vq" },
  { title: "Back to the Future",                      img: "back-to-the-future.jpg",       url: "https://canvas.instructure.com/files/336353265/download?download_frd=1&verifier=Ug4mZFbdfCKrIOubhAE0Eg7ONX6PsTazNVq75ngi" },
  { title: "Matilda",                                 img: "matilda.jpg",                  url: "https://canvas.instructure.com/files/336353241/download?download_frd=1&verifier=4nk4nqhHnOk35I5F7dPuHWhQHmIEbUoE4E5IrjJ2" },
  { title: "The Sandlot",                             img: "the-sandlot.jpeg",             url: "https://canvas.instructure.com/files/336353237/download?download_frd=1&verifier=yGXfogI6tboVcwkgVCwhoX7SzUJV3r8ghL9CaS1E" },
  { title: "Star Wars: Attack of the Clones",         img: "star-wars-clones-attack.webp", url: "https://canvas.instructure.com/files/336352899/download?download_frd=1&verifier=Z7iqV6r6yPAQypgDWHOIkUVz6rWFCUohSO8A7Qt4" },
  { title: "Star Wars: Revenge of the Sith",          img: "star-wars-revenge-sith.jpg",   url: "https://canvas.instructure.com/files/336352875/download?download_frd=1&verifier=Fahq55ry2P7XMmehEpRTjp8h97NPKagpCUT28r4r" },
  { title: "Star Wars: The Phantom Menace",           img: "star-wars-phantom-menace.jpg", url: "https://canvas.instructure.com/files/336352825/download?download_frd=1&verifier=b1bJAoNkb8NP1J45THGjPlSih4o1yhf1aYKI5mHb" },
  { title: "Star Wars: Return of the Jedi",           img: "star-wars-return-jedi.jpg",    url: "https://canvas.instructure.com/files/336352817/download?download_frd=1&verifier=5UezjAI6rKIGJNgBYV9Mkc7U3Vm2mBcROFBrCraw" },
  { title: "Star Wars: The Empire Strikes Back",      img: "star-wars-empire-back.jpg",    url: "https://canvas.instructure.com/files/336352733/download?download_frd=1&verifier=ctgKhgCm4ITalwwJcXChsqmB0yWT9qYtwjd1gaFR" },
  { title: "Star Wars: A New Hope",                   img: "star-wars-new-hope.jpg",       url: "https://canvas.instructure.com/files/336352727/download?download_frd=1&verifier=I2M0f8KebVxnJ7DvVbrd6oSCsTGQuw7s4h1Zl57d" },
  { title: "Five Nights at Freddy's",                 img: "fnaf.webp",                    url: "https://canvas.instructure.com/files/336352731/download?download_frd=1&verifier=qbeQ45Zu6vZMqN4BtOH15cR8xXAVjUs4965fnFfd" },
  { title: "Five Nights at Freddy's 2",               img: "five-nights-at-freddys.jpg",   url: "https://canvas.instructure.com/files/336352561/download?download_frd=1&verifier=6K5a2Hsiig6WD8udJ84jWEJ8FF0ZghMoZEILa91R" },
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

function VideoPlayer({ movie, onClose }: { movie: Movie; onClose: () => void }) {
  const playerSrc = `/api/movies/viper-page?url=${encodeURIComponent(movie.url)}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

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
          height: "min(92vh, 680px)",
          animation: "slideInModal 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
        onClick={e => e.stopPropagation()}
        data-testid="video-player-modal"
      >
        <div className="flex items-center justify-between px-4 h-10 bg-[#1c1c1c] border-b border-white/[0.08] shrink-0">
          <h3 className="text-white/90 font-semibold text-sm tracking-wide truncate">{movie.title}</h3>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors ml-4 shrink-0 text-lg leading-none px-1"
            data-testid="button-close-player"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <iframe
          src={playerSrc}
          className="flex-1 w-full border-0 bg-black"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
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
