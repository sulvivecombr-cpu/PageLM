import React from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onPickFile: () => void;
  onRemoveFile: () => void;
  stagedFileName: string | null;
  busy?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
};

export default function PromptBox({
  value,
  onChange,
  onSend,
  onPickFile,
  onRemoveFile,
  stagedFileName,
  busy,
  onDragOver,
  onDrop,
}: Props) {
  return (
    <div
      className="rounded-3xl border border-stone-900 bg-stone-950 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_18px_40px_-24px_rgba(15,23,42,0.45)] transition-colors"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {stagedFileName && (
        <div className="px-3 pt-3">
          <div className="inline-flex max-w-full items-center gap-3 rounded-2xl border border-stone-800 bg-stone-900/60 px-3 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-400/40 bg-rose-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-5 text-rose-300" fill="currentColor">
                <path d="M9 2a1 1 0 0 0-1 1v4H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V3a1 1 0 0 0-1-1H9Zm5 5H10V4h4v3Z" />
              </svg>
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm text-stone-100">{stagedFileName}</span>
              <span className="text-xs text-stone-400">Attached</span>
            </div>
            <button
              onClick={onRemoveFile}
              className="ml-1 rounded-lg p-1 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white"
              aria-label="Remove file"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <textarea
        rows={2}
        placeholder="Ask me to teach you anything..."
        className="w-full resize-none bg-transparent px-4 pb-2 pt-4 text-[15px] leading-6 text-stone-200 outline-none placeholder:text-stone-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        aria-label="Main prompt"
      />

      <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full bg-stone-900 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white disabled:opacity-50"
          aria-label="Attach file"
          onClick={onPickFile}
          disabled={busy}
          title={stagedFileName ?? "Upload files"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
          </svg>
        </button>

        <button
          onClick={onSend}
          disabled={busy || !value.trim()}
          className="flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2.5 text-sm font-semibold text-[#fff] shadow-sm transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send"
          title={busy ? "Please wait..." : "Send"}
        >
          <span>{busy ? "Working" : "Send"}</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
