import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="text-center"
      >
        <h1 className="text-8xl font-bold tracking-tighter text-primary">
          404
        </h1>
        <p className="mt-4 text-xl font-semibold text-foreground">
          Page not found
        </p>
        <p className="mt-2 text-muted-foreground">
          The page you are looking for does not exist.
        </p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Home className="size-4" />
          Go to dashboard
        </Link>
      </motion.div>
    </div>
  );
}
