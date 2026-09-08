/**
 * Drag affordance for a list row. Drawn rather than typed: the usual grip
 * glyphs (⠿, ∷) fall back to tofu in some system monospace fonts.
 */
export function Grip() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true" focusable="false">
      {[2, 8, 14].map((cy) =>
        [2, 8].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.4" fill="currentColor" />),
      )}
    </svg>
  );
}
