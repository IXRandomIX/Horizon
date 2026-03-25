import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a1a] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, #a855f7 1px, transparent 1px)",
        backgroundSize: "32px 32px"
      }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center px-6">
        <h1 className="text-[10rem] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-green-400 to-green-600 select-none">
          404
        </h1>
        <h2 className="text-3xl font-bold text-white mt-2 mb-4">
          Page Not Found
        </h2>
        <p className="text-white/50 text-base mb-10 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <button className="px-6 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors text-sm">
            Go Home
          </button>
        </Link>
      </div>
    </div>
  );
}
