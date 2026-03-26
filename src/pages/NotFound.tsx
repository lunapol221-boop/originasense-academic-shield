import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute top-1/3 left-1/3 w-80 h-80 rounded-full opacity-15 blur-[120px]" style={{ background: "hsl(172 66% 40%)" }} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center relative z-10 max-w-md px-6"
      >
        <div className="font-display text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
        <p className="text-muted-foreground text-sm mb-8">
          The page <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{location.pathname}</code> doesn't exist.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Home className="w-4 h-4 mr-2" /> Go Home
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
