import { useState } from "react";
import { motion } from "framer-motion";
import type { Game } from "@shared/routes";

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export function GameCard({ game, onClick }: GameCardProps) {
  const [imgError, setImgError] = useState(false);

  // Safely parse template URL strings if they exist
  const coverUrl = game.cover?.replace('{COVER_URL}', 'https://cdn.jsdelivr.net/gh/gn-math/covers@main') || '';

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative cursor-pointer rounded-2xl bg-card border border-white/5 overflow-hidden shadow-lg shadow-black/60 hover:shadow-[0_0_25px_rgba(147,51,234,0.25)] hover:border-primary/40 transition-all duration-300 flex flex-col"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-black relative">
        {/* Retro arcade background fallback image if the cover fails to load */}
        <img
          src={imgError ? "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop" : coverUrl}
          onError={() => setImgError(true)}
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          loading="lazy"
        />
        
        {/* Elegant shadow gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Text Content */}
        <div className="absolute bottom-0 left-0 w-full p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-10">
          <h3 className="text-lg font-bold text-white tracking-wide truncate drop-shadow-md">
            {game.name}
          </h3>
          <p className="text-xs text-primary/90 font-semibold uppercase tracking-wider truncate opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75 mt-1.5">
            {game.author || 'Play Now'}
          </p>
        </div>
      </div>
      
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
}
