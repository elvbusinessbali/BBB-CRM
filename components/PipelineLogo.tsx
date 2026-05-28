/**
 * A tiny pipeline icon: 4 connected dots in the actual customer-status colors
 * (cold → warm → hot → active). Doubles as the BBB CRM brand mark.
 */
export function PipelineLogo({ className = 'h-5 w-auto' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 16"
      role="img"
      aria-label="BBB CRM"
      className={className}
    >
      {/* Connecting line */}
      <line
        x1="6"
        y1="8"
        x2="50"
        y2="8"
        stroke="#d4d4d4"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Cold (sky) */}
      <circle cx="6" cy="8" r="3.5" fill="#7dd3fc" />
      {/* Warm (amber) */}
      <circle cx="20" cy="8" r="4" fill="#fbbf24" />
      {/* Hot (rose) */}
      <circle cx="35" cy="8" r="4.5" fill="#fb7185" />
      {/* Active (emerald) */}
      <circle cx="50" cy="8" r="5" fill="#34d399" />
    </svg>
  );
}
