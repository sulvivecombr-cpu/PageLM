import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => void;
  /** Optional control rendered at the start of the bar (e.g. saved notes). */
  leading?: ReactNode;
};

export default function Composer({ disabled, onSend, leading }: Props) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const onInput = () => {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 256) + "px";
    };
    el.addEventListener("input", onInput);
    onInput();
    return () => el.removeEventListener("input", onInput);
  }, []);

  const send = () => {
    const el = inputRef.current;
    if (!el) return;
    const v = el.value.trim();
    if (!v) return;
    onSend(v);
    el.value = "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return (
    <div className="fixed inset-x-3 bottom-[5.25rem] z-40 md:inset-x-auto md:bottom-0 md:left-32 md:right-4 md:border-t md:border-stone-900 md:bg-[var(--app-bg)] md:pb-4 md:pt-5">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-end gap-2 rounded-3xl border border-stone-900 bg-stone-950 p-2 shadow-lg shadow-black/10 transition-colors">
          {leading}
          <textarea
            ref={inputRef}
            placeholder="Ask a follow-up question or request more examples..."
            rows={1}
            className="max-h-40 min-h-11 flex-1 resize-none overflow-y-auto rounded-2xl bg-transparent px-3 py-2.5 text-sm text-stone-200 outline-none placeholder:text-stone-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!disabled) send();
              }
            }}
          />
          <button
            onClick={send}
            disabled={disabled}
            className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-500 text-[#fff] transition-colors hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Send"
            title={disabled ? "Please wait..." : "Send"}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="size-4">
              <path d="M7.33496 15.5V4.5C7.33496 4.13275 7.63275 3.83499 8 3.83496C8.36727 3.83496 8.66504 4.13273 8.66504 4.5V15.5C8.66504 15.8673 8.36727 16.165 8 16.165C7.63275 16.165 7.33496 15.8673 7.33496 15.5ZM11.335 13.1309V7.20801C11.335 6.84075 11.6327 6.54298 12 6.54297C12.3673 6.54297 12.665 6.84074 12.665 7.20801V13.1309C12.665 13.4981 12.3672 13.7959 12 13.7959C11.6328 13.7959 11.335 13.4981 11.335 13.1309ZM3.33496 11.3535V8.81543C3.33496 8.44816 3.63273 8.15039 4 8.15039C4.36727 8.15039 4.66504 8.44816 4.66504 8.81543V11.3535C4.66504 11.7208 4.36727 12.0186 4 12.0186C3.63273 12.0186 3.33496 11.7208 3.33496 11.3535ZM15.335 11.3535V8.81543C15.335 8.44816 15.6327 8.15039 16 8.15039C16.3673 8.15039 16.665 8.44816 16.665 8.81543V11.3535C16.665 11.7208 16.3673 12.0186 16 12.0186C15.6327 12.0186 15.335 11.7208 15.335 11.3535Z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
