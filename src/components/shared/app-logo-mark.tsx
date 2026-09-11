import { cn } from "@/lib/utils";

type AppLogoMarkProps = {
  className?: string;
};

export function AppLogoMark({ className }: AppLogoMarkProps) {
  return (
    <span className={cn("grid shrink-0 place-items-center text-foreground", className)}>
      <svg viewBox="0 0 48 48" aria-hidden="true" className="size-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 4.8V10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M24 38V43.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M4.8 24H10" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M38 24H43.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />

        <path d="M11.1 16.9A15.2 15.2 0 0 1 19.9 9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M28.1 9.1A15.2 15.2 0 0 1 36.9 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M36.9 31.1A15.2 15.2 0 0 1 28.1 39" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M19.9 39A15.2 15.2 0 0 1 11.1 31.1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />

        <path d="M16.3 29.5A9.2 9.2 0 0 1 18.4 17.4" stroke="rgb(107 111 118)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M22 15.2A9.2 9.2 0 0 1 32.7 24" stroke="rgb(107 111 118)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M31.7 28.3A9.2 9.2 0 0 1 19.5 32.9" stroke="rgb(107 111 118)" strokeWidth="2.2" strokeLinecap="round" />

        <path d="M24 24L33.6 14.4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
        <circle cx="33.6" cy="14.4" r="3.2" stroke="currentColor" strokeWidth="2.3" />
        <circle cx="36.7" cy="19.6" r="2.2" fill="#7180ff" />
      </svg>
    </span>
  );
}
