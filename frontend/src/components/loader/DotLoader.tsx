import type { HTMLAttributes } from "react";

interface DotLoaderProps extends HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export default function DotLoader({
  className = "",
  ...props
}: DotLoaderProps) {
  return (
    <div>
        <div className="flex items-end gap-2">
        <span
          className="h-3.5 w-3.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-bounce"
          style={{ animationDelay: "0s" }}
        />
        <span
          className="h-3.5 w-3.5 rounded-full bg-sky-500/80 dark:bg-sky-400/80 animate-bounce"
          style={{ animationDelay: "0.12s" }}
        />
        <span
          className="h-3.5 w-3.5 rounded-full bg-sky-500/60 dark:bg-sky-400/60 animate-bounce"
          style={{ animationDelay: "0.24s" }}
        />
      </div>
    </div>
      
  );
}
