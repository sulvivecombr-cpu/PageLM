type Props = {
  count: number;
  onClick: () => void;
};

/** Saved-notes launcher, sitting inside the chat composer bar. */
export default function BagFab({ count, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-stone-900 transition-colors hover:bg-stone-800"
      aria-label={`Abrir notas salvas (${count})`}
      title="Notas salvas"
    >
      <img
        src="https://forum.playhive.com/uploads/default/original/3X/f/3/f3e340eef1c12e1080f55958d70c5afc8a73dfa3.png"
        alt=""
        className="size-6 object-contain"
        loading="lazy"
        decoding="async"
      />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-[#fff]">
          {count}
        </span>
      )}
    </button>
  );
}
