import { useState, useRef, useEffect, useCallback } from "react";
import { usePageXP } from "@/hooks/use-xp-track";
import { useQuery } from "@tanstack/react-query";
import { X, Search, Play } from "lucide-react";

const MOVIES = [
  { id: 1,  title: "Zootopia 2",                          url: "https://canvas.instructure.com/files/6936~44365493/download?download_frd=1&verifier=zYUDHBZwJ6nWmMAE6Z9tWoRuOZXXxC0Bq7l4O0YM" },
  { id: 2,  title: "Shrek",                               url: "https://canvas.instructure.com/files/6936~44388897/download?download_frd=1&verifier=MvARGOnKCU9C3F6vuOs0CyBPVl32ej8xBQlRgXYO" },
  { id: 3,  title: "Shrek 2",                             url: "https://canvas.instructure.com/files/6936~44386173/download?download_frd=1&verifier=Cetd6XyRZAMqQm3wiYOyy3n0VN988WH5TYZukCya" },
  { id: 4,  title: "Shrek 3",                             url: "https://canvas.instructure.com/files/6936~44386174/download?download_frd=1&verifier=lc5GxcD0IHQ6oVXvQ3hUzFXdIjZZ5IkupKFJthQD" },
  { id: 5,  title: "Shrek 4",                             url: "https://canvas.instructure.com/files/6936~44386170/download?download_frd=1&verifier=VWT81usNqEg8v91f11lUOW8LMnxKiAkaeHis9ifY" },
  { id: 6,  title: "Interstellar",                        url: "https://canvas.instructure.com/files/6936~44391184/download?download_frd=1&verifier=CotCKyrd0BnrkgNF5HiMkHKhsepoOKYZipYDnayT" },
  { id: 7,  title: "John Wick",                           url: "https://canvas.instructure.com/files/6936~44391317/download?download_frd=1&verifier=FWozOuc8kCEe78MngfnRsSfC4vFGtLGwu8O9RJXr" },
  { id: 8,  title: "John Wick 2",                         url: "https://canvas.instructure.com/files/6936~44398495/download?download_frd=1&verifier=i5gwc1H1Ocm1TGG4936yFwwBg9tOUf7i77sAQrMI" },
  { id: 9,  title: "John Wick 3",                         url: "https://canvas.instructure.com/files/6936~44398539/download?download_frd=1&verifier=NdOAheaQ9nRTeF4rbhsqElKWHE4vtulDQi4HrvO7" },
  { id: 10, title: "John Wick 4",                         url: "https://canvas.instructure.com/files/6936~44398585/download?download_frd=1&verifier=HvVhS52Eul4svdnW7q5ThUMRqbXdouFv0QIetRON" },
  { id: 11, title: "Home Team",                           url: "https://canvas.instructure.com/files/6936~44406952/download?download_frd=1&verifier=9R8UucBusdUScWblBBYVXRWCiKp1NkR1Z0lZbAts" },
  { id: 12, title: "Twisters",                            url: "https://canvas.instructure.com/files/6936~44410719/download?download_frd=1&verifier=8gC2u2XyahBGqEPnyhAfj8z521Wo3viFmInLRv9Q" },
  { id: 13, title: "The Simpsons Movie",                  url: "https://canvas.instructure.com/files/334517367/download?download_frd=1&verifier=IVwwgUzBRSJEm61EL6yZqQ532bfpjoi1Vv1yiosp" },
  { id: 14, title: "Whiplash",                            url: "https://canvas.instructure.com/files/335024839/download?download_frd=1&verifier=HECuTstyDHNDwITL0y83P1PgP7863K0qKGZMf9SM" },
  { id: 15, title: "The Karate Kid",                      url: "https://canvas.instructure.com/files/336194149/download?download_frd=1&verifier=ZScQUPRsFl4DlIX8tyy1D193d555HZ4bePWgLHZ5" },
  { id: 16, title: "The Karate Kid 2",                    url: "https://canvas.instructure.com/files/336194061/download?download_frd=1&verifier=ebUrjSmADnsu6TSxtlQ33rkbnLgi1phgNkO40psh" },
  { id: 17, title: "The Lego Batman Movie",               url: "https://canvas.instructure.com/files/336195933/download?download_frd=1&verifier=W40hzK5JFGnsi6qMwi7YbrUVMQVwaRB54pKvwL9K" },
  { id: 18, title: "Sonic the Hedgehog",                  url: "https://canvas.instructure.com/files/336194121/download?download_frd=1&verifier=KKOI6nHYBTY0S9RWG7vt7ntCBkqPw7khc4TCgz8I" },
  { id: 19, title: "Sonic the Hedgehog 2",                url: "https://canvas.instructure.com/files/336194499/download?download_frd=1&verifier=Z57akm29JNwS5UiY2ggZGZcqBTMlxvs2ldlPbPZL" },
  { id: 20, title: "Harry Potter and the Sorcerer's Stone", url: "https://canvas.instructure.com/files/336353613/download?download_frd=1&verifier=gLeLZUinsDCE9CxspkF4AS4Axl2rpqELE8HhGhra" },
  { id: 21, title: "Harry Potter and the Chamber of Secrets", url: "https://canvas.instructure.com/files/336353615/download?download_frd=1&verifier=IOgxEpzL2ZrdZZqAHoJyplkQGKc6JXyQ7j27pGDk" },
  { id: 22, title: "Harry Potter and the Prisoner of Azkaban", url: "https://canvas.instructure.com/files/336353683/download?download_frd=1&verifier=QaEWVI4az1wQM9AYBkHAjay6LILK0lZsvqRetrGr" },
  { id: 23, title: "Harry Potter and the Goblet of Fire", url: "https://canvas.instructure.com/files/336353649/download?download_frd=1&verifier=HNv5BvVNevSKZgHKmY5oSc8NOhBT7Wt3VYDPBmhA" },
  { id: 24, title: "Harry Potter and the Order of the Phoenix", url: "https://canvas.instructure.com/files/336353445/download?download_frd=1&verifier=NQ9Gy3gLnR3g1aXhIkcDJ3fniaxa0gtEo6EKXC2k" },
  { id: 25, title: "Harry Potter and the Half-Blood Prince", url: "https://canvas.instructure.com/files/336353239/download?download_frd=1&verifier=tPmOncG5hPAik92zu2lzoi2lIImp7hvn8TWzVNEW" },
  { id: 26, title: "Harry Potter and the Deathly Hallows Part 1", url: "https://canvas.instructure.com/files/336353041/download?download_frd=1&verifier=4TCIqO16sCHtagTSZwiYOxyVlQcvCtGvsbMSQOqt" },
  { id: 27, title: "Harry Potter and the Deathly Hallows Part 2", url: "https://canvas.instructure.com/files/336353283/download?download_frd=1&verifier=Hacx1TMvAlNRB3xX1eiZadjew3wY9U4kOuDQOv4C" },
  { id: 28, title: "Indiana Jones and the Last Crusade",  url: "https://canvas.instructure.com/files/336353597/download?download_frd=1&verifier=urHOBw6RBWmsa2ft7Tmd8zZdkTpqlyJoUzoD6Ic1" },
  { id: 29, title: "Indiana Jones and the Kingdom of the Crystal Skull", url: "https://canvas.instructure.com/files/336353571/download?download_frd=1&verifier=CamVNBreTvagVWhuDJv1enoCuuzv5wSMQn3dmLpt" },
  { id: 30, title: "Indiana Jones and the Temple of Doom", url: "https://canvas.instructure.com/files/336353519/download?download_frd=1&verifier=JFRbW4QtKk6nCkSe3883kQRNwR78J5K8533sIJ5y" },
  { id: 31, title: "Indiana Jones and the Raiders of the Lost Ark", url: "https://canvas.instructure.com/files/336353503/download?download_frd=1&verifier=DrjJn6HI0Q8NnxMoDiQ2hHlELsWVQ4zpx6Q7fOjT" },
  { id: 32, title: "Happy Gilmore",                       url: "https://canvas.instructure.com/files/336353391/download?download_frd=1&verifier=FKZTQs2gmy3U6JJ369W2WRg4f7PCKBK5DHbnx8Qj" },
  { id: 33, title: "Happy Gilmore 2",                     url: "https://canvas.instructure.com/files/336353515/download?download_frd=1&verifier=E6ciOBxCD8PudDUNHkOi3m091XdxOvRE6KmjjPTU" },
  { id: 34, title: "The Matrix",                          url: "https://canvas.instructure.com/files/336353499/download?download_frd=1&verifier=zNIbcrC2mihTdVgnjVOJtvRITwxmOsJcpHhf67pe" },
  { id: 35, title: "The Outsiders",                       url: "https://canvas.instructure.com/files/336353497/download?download_frd=1&verifier=NcTIh7B6UhbuyNNdpXxHrfnDslvJpkLb8kZI5FND" },
  { id: 36, title: "War of the Worlds",                   url: "https://canvas.instructure.com/files/336353479/download?download_frd=1&verifier=MAj5gRjOjc5xWxcqcAAJNGBpboitXghLAcbvJAf" },
  { id: 37, title: "Oppenheimer",                         url: "https://canvas.instructure.com/files/336353463/download?download_frd=1&verifier=Vn7XeHD3kRxjMmDWdQFYQJ8BUzdzx5eceBjlAqTl" },
  { id: 38, title: "IT",                                  url: "https://canvas.instructure.com/files/336353379/download?download_frd=1&verifier=nmFpqJHeqiYC70TLWEnFJ9vSC5ADyS4VSyxHy3Vq" },
  { id: 39, title: "Back to the Future",                  url: "https://canvas.instructure.com/files/336353265/download?download_frd=1&verifier=Ug4mZFbdfCKrIOubhAE0Eg7ONX6PsTazNVq75ngi" },
  { id: 40, title: "Matilda",                             url: "https://canvas.instructure.com/files/336353241/download?download_frd=1&verifier=4nk4nqhHnOk35I5F7dPuHWhQHmIEbUoE4E5IrjJ2" },
  { id: 41, title: "The Sandlot",                         url: "https://canvas.instructure.com/files/336353237/download?download_frd=1&verifier=yGXfogI6tboVcwkgVCwhoX7SzUJV3r8ghL9CaS1E" },
  { id: 42, title: "Star Wars: Attack of the Clones",     url: "https://canvas.instructure.com/files/336352899/download?download_frd=1&verifier=Z7iqV6r6yPAQypgDWHOIkUVz6rWFCUohSO8A7Qt4" },
  { id: 43, title: "Star Wars: Revenge of the Sith",      url: "https://canvas.instructure.com/files/336352875/download?download_frd=1&verifier=Fahq55ry2P7XMmehEpRTjp8h97NPKagpCUT28r4r" },
  { id: 44, title: "Star Wars: The Phantom Menace",       url: "https://canvas.instructure.com/files/336352825/download?download_frd=1&verifier=b1bJAoNkb8NP1J45THGjPlSih4o1yhf1aYKI5mHb" },
  { id: 45, title: "Star Wars: Return of the Jedi",       url: "https://canvas.instructure.com/files/336352817/download?download_frd=1&verifier=5UezjAI6rKIGJNgBYV9Mkc7U3Vm2mBcROFBrCraw" },
  { id: 46, title: "Star Wars: The Empire Strikes Back",  url: "https://canvas.instructure.com/files/336352733/download?download_frd=1&verifier=ctgKhgCm4ITalwwJcXChsqmB0yWT9qYtwjd1gaFR" },
  { id: 47, title: "Star Wars: A New Hope",               url: "https://canvas.instructure.com/files/336352727/download?download_frd=1&verifier=I2M0f8KebVxnJ7DvVbrd6oSCsTGQuw7s4h1Zl57d" },
  { id: 48, title: "Five Nights at Freddy's",             url: "https://canvas.instructure.com/files/336352731/download?download_frd=1&verifier=qbeQ45Zu6vZMqN4BtOH15cR8xXAVjUs4965fnFfd" },
  { id: 49, title: "Five Nights at Freddy's 2",           url: "https://canvas.instructure.com/files/336352561/download?download_frd=1&verifier=6K5a2Hsiig6WD8udJ84jWEJ8FF0ZghMoZEILa91R" },
];

function MovieCard({ movie, onPlay }: { movie: typeof MOVIES[0]; onPlay: () => void }) {
  const { data } = useQuery<{ poster: string | null }>({
    queryKey: ["/api/movies/poster", movie.title],
    queryFn: () => fetch(`/api/movies/poster?title=${encodeURIComponent(movie.title)}`).then(r => r.json()),
    staleTime: Infinity,
  });

  const poster = data?.poster;
  const savedTime = parseFloat(localStorage.getItem(`movie_time_${movie.id}`) || "0");
  const hasProgress = savedTime > 30;

  return (
    <div
      className="movie-card group relative overflow-hidden rounded-lg cursor-pointer select-none"
      style={{ flex: "0 0 auto", width: "160px", aspectRatio: "2/3", background: "#0d0d0d" }}
      onClick={onPlay}
      data-testid={`movie-card-${movie.id}`}
    >
      {poster ? (
        <img
          src={poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
          <Play className="w-8 h-8 text-zinc-600" />
        </div>
      )}

      {/* gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg" />

      {/* title slides up on hover */}
      <p
        className="absolute left-0 right-0 bottom-0 text-white text-xs font-semibold px-2 pb-2 pt-6 text-center
                   translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                   transition-all duration-300 pointer-events-none leading-tight"
        style={{ textShadow: "0 0 8px #000" }}
      >
        {movie.title}
      </p>

      {/* resume dot */}
      {hasProgress && (
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-purple-400 opacity-80" title="Resume available" />
      )}
    </div>
  );
}

function VideoPlayer({ movie, onClose }: { movie: typeof MOVIES[0]; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const saved = parseFloat(localStorage.getItem(`movie_time_${movie.id}`) || "0");
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => {
      if (saved > 30 && saved < video.duration - 60) {
        video.currentTime = saved;
      }
    };
    video.addEventListener("loadedmetadata", onLoaded);

    intervalRef.current = setInterval(() => {
      if (!video) return;
      const t = video.currentTime;
      const dur = video.duration;
      if (dur && t + 120 < dur) {
        localStorage.setItem(`movie_time_${movie.id}`, String(t));
      } else if (dur && t + 120 >= dur) {
        localStorage.removeItem(`movie_time_${movie.id}`);
      }
    }, 3000);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [movie.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black animate-in slide-in-from-bottom duration-500"
      data-testid="video-player-overlay"
    >
      {/* top bar */}
      <div className="flex items-center justify-between px-4 h-12 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <h3 className="text-white font-semibold text-sm truncate">{movie.title}</h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors ml-4 shrink-0"
          data-testid="button-close-player"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      {/* video */}
      <video
        ref={videoRef}
        className="flex-1 w-full bg-black"
        controls
        autoPlay
        data-testid="video-player-element"
      >
        <source src={movie.url} type="video/mp4" />
      </video>
    </div>
  );
}

export default function MoviesPage() {
  usePageXP("movies_visited");
  const [search, setSearch] = useState("");
  const [playing, setPlaying] = useState<typeof MOVIES[0] | null>(null);

  const filtered = MOVIES.filter(m =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleClose = useCallback(() => setPlaying(null), []);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0d0d0d] text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <h1 className="text-4xl font-bold mb-1 tracking-tight bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
          Horizon Movies
        </h1>
        <p className="text-zinc-500 text-sm mb-6">{MOVIES.length} films available</p>

        {/* Search */}
        <div className="relative mb-8 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
            data-testid="input-movie-search"
          />
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="text-zinc-600 text-sm">No movies found.</p>
        ) : (
          <div
            className="flex flex-wrap gap-4"
            data-testid="movies-grid"
          >
            {filtered.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onPlay={() => setPlaying(movie)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Player overlay */}
      {playing && (
        <VideoPlayer movie={playing} onClose={handleClose} />
      )}
    </div>
  );
}
