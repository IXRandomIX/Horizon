import { Cpu, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Tools() {
  return (
    <div className="flex flex-col h-full bg-black overflow-y-auto custom-scrollbar p-6 md:p-12">
      <div className="max-w-6xl mx-auto w-full">
        <h1 className="text-4xl md:text-6xl font-display font-black text-white mb-12 text-gradient-animated tracking-widest uppercase text-center">
          Media / Tools
        </h1>
        
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-white/[0.03] border-white/10 hover:border-primary/50 transition-all group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                  <Wand2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl text-white font-display tracking-widest">Humanizer AI</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Advanced text bypass and humanization engine</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Button 
                  className="w-full bg-primary text-white font-bold h-14 rounded-2xl text-lg hover:scale-[1.02] transition-all shadow-lg shadow-primary/20"
                  onClick={() => window.open("https://humanize-text-bypass--nkchknc.replit.app/", '_blank')}
                >
                  Launch Humanizer
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
