import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Lock, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Announcements() {
  const openCloaked = () => {
    const win = window.open('about:blank', '_blank', 'width=1200,height=800');
    if (!win) return;
    
    // Set title and content after a small delay to ensure about:blank is ready
    setTimeout(() => {
      win.document.title = "Google Classroom";
      
      const iframe = win.document.createElement('iframe');
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      iframe.style.position = "fixed";
      iframe.style.top = "0";
      iframe.style.left = "0";
      iframe.style.bottom = "0";
      iframe.style.right = "0";
      iframe.src = window.location.origin;
      
      win.document.body.style.margin = "0";
      win.document.body.style.padding = "0";
      win.document.body.appendChild(iframe);
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto custom-scrollbar relative p-6 md:p-12">
      <div className="max-w-4xl mx-auto w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-8 text-gradient-animated tracking-widest uppercase">
            Announcements
          </h1>
          
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur opacity-25 group-hover:opacity-40 transition duration-500" />
            <div className="relative space-y-6">
              <div className="flex items-center gap-3 text-primary mb-4">
                <Zap className="w-6 h-6 animate-pulse" />
                <span className="font-display font-bold tracking-widest text-xl">URGENT TRANSMISSION</span>
              </div>
              <p className="text-2xl md:text-3xl font-display text-white leading-relaxed italic">
                "GANG WE ARE SO BACK! HORIZON BETTER THAN BEFORE!!!!!! Well it will be. Also uh Gatekeep this shit. Thats all I gotta say for now."
              </p>
            </div>
          </div>

          <div className="space-y-8 max-w-2xl mx-auto">
            <p className="text-lg md:text-xl font-display text-gradient-animated italic leading-relaxed">
              Hello, Zach/ @randomix9 on TikTok, speaking. If you got this from me directly or from my TikTok, promise me that you will gatekeep this at all times, don't even give it to your friends unless they find my website by themselves, and also... DONT. GET. CAUGHT. I swear if y'all have a blocker that has a classroom thing when your teacher turns it on they can see your screen do not ever, ever use this website during that time. But WE ARE SOOOOOO BACK!!!!! Anyways.... enjoy....
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={openCloaked}
                className="bg-black border-2 border-primary text-white font-display text-2xl px-12 py-8 rounded-full hover:bg-primary/10 transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] group relative overflow-hidden h-auto"
              >
                <span className="relative z-10 text-gradient-animated font-black tracking-widest">GATEKEEP NOW!!!!</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
