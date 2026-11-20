import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatJSON } from "../../lib/api";

const PROMPTS = [
  "Me dê uma aula sobre equações do segundo grau. Considere que eu não sei nada.",
  "Explique o básico da fotossíntese.",
  "Como escrevo um conto curto e envolvente?",
  "O que é aprendizado de máquina e como funciona?",
  "Me ensine os fundamentos da culinária.",
  "Me ajude a entender a Revolução Francesa.",
  "Explique conceitos de programação.",
  "Como organizo minhas finanças pessoais?",
];

const ITEM_H = 32;

function useReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const m = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!m) return;
    const on = () => setPrefers(!!m.matches);
    on();
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);
  return prefers;
}

export default function PromptRail({ onSend }: { onSend?: (prompt: string) => void }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(2);
  const [busy, setBusy] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % PROMPTS.length), 3500);
    return () => clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    let dragging = false, startY = 0, startIndex = 0;

    const down = (e: PointerEvent) => {
      dragging = true;
      startY = e.clientY;
      startIndex = index;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const delta = Math.round(-(e.clientY - startY) / ITEM_H);
      const next = Math.max(0, Math.min(PROMPTS.length - 1, startIndex + delta));
      if (next !== index) setIndex(next);
    };
    const up = (e: PointerEvent) => {
      dragging = false;
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    };

    el.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [index]);

  const translateY = -(index * ITEM_H);

  const sendNow = async () => {
    const q = PROMPTS[index];
    if (busy) return;
    if (onSend) {
      onSend(q);
      return;
    }
    try {
      setBusy(true);
      const r = await chatJSON({ q });
      const cid = r?.chatId || "";
      navigate(`/chat?chatId=${encodeURIComponent(cid)}&q=${encodeURIComponent(q)}`, {
        state: { chatId: cid, q },
      });
    } catch {
      /* keep the typed prompt if the request fails */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ml-auto hidden items-center gap-2 rounded-full border border-stone-900 bg-stone-950 py-1 pl-3 pr-1 md:flex">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Teste</span>
      <div ref={railRef} className="relative h-8 w-44 cursor-grab overflow-hidden active:cursor-grabbing lg:w-72">
        <div className="transition-transform duration-500 ease-in-out" style={{ transform: `translateY(${translateY}px)` }}>
          {PROMPTS.map((p, i) => (
            <div key={i} className="flex h-8 items-center">
              <span className="truncate text-xs text-stone-300">{p}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={sendNow}
        disabled={busy}
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-stone-900 text-stone-300 transition-colors hover:bg-stone-800 hover:text-white disabled:opacity-50"
        aria-label="Enviar sugestão"
        title={busy ? "Iniciando..." : "Enviar"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="size-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
        </svg>
      </button>
    </div>
  );
}
