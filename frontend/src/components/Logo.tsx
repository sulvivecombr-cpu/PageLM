type Props = {
  /** Square size of the mark in px. */
  size?: number;
  /** Show the PageLM wordmark next to the mark. */
  withWordmark?: boolean;
};

/** PageLM mark: dark sunglasses on a light tile. */
export default function Logo({ size = 40, withWordmark = false }: Props) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="img"
        aria-label="PageLM"
        className="flex shrink-0 items-center justify-center rounded-xl border border-stone-900 bg-[#fff] shadow-[0_1px_2px_rgba(15,23,42,0.10)]"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.6), lineHeight: 1 }}
      >
        🕶️
      </span>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-tight text-stone-100">PageLM</span>
      )}
    </span>
  );
}
