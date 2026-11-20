import React, { useRef, useState } from "react";
import { AdaptiveErrorBoundary, adaptiveToast } from '@cognicatch/react'
import { useNavigate } from "react-router-dom";
import PromptRail from "../components/Landing/PromptRail";
import PromptBox from "../components/Landing/PromptBox";
import ExploreTopics from "../components/Landing/ExploreTopics";
import { chatJSON, uploadSources } from "../lib/api";

export default function Landing() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"Chat" | "Quiz">("Chat");
  const [responseLength, setResponseLength] = useState<"Short" | "Medium" | "Long">("Medium");
  const [showMode, setShowMode] = useState(false);
  const [showLength, setShowLength] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const onPickFile = () => fileRef.current?.click();
  const onRemoveFile = () => setStagedFile(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setStagedFile(f);
  };
  const onDropZoneDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0] ?? null;
    setStagedFile(f);
  };

  const onSend = async (override?: string) => {
    if (busy) return;
    const q = (override ?? prompt).trim();
    if (!q && !stagedFile) return;

    if (mode === "Quiz" && !stagedFile) {
      navigate(`/quiz?topic=${encodeURIComponent(q)}`, { state: { topic: q } });
      return;
    }

    setBusy(true);
    try {
      if (stagedFile) {
        const res = await uploadSources([stagedFile]);
        const source = res.sources?.[0];
        if (!source) throw new Error("upload failed");
        if (mode === "Quiz") {
          navigate(`/studio?sourceId=${encodeURIComponent(source.id)}`);
        } else {
          const params = new URLSearchParams({ sourceId: source.id });
          if (q) params.set("q", q);
          navigate(`/chat?${params.toString()}`);
        }
        return;
      }
      const r = await chatJSON({ q });
      navigate(`/chat?chatId=${encodeURIComponent(r.chatId)}&q=${encodeURIComponent(q)}`);
    } catch {
      adaptiveToast.error("Failed to start chat", "There was a problem reaching the AI. Please try sending your prompt again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col px-4 pb-28 md:pb-24 md:pl-32">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center pt-12 md:pt-4">
        <div className="mb-6 md:mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-stone-800 bg-stone-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            <span className="size-1.5 rounded-full bg-sky-500" />
            AI study workspace
          </span>
          <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            What&apos;d you like to learn today?
          </h1>
          <p className="mt-2 max-w-xl text-sm text-stone-400 sm:text-base">
            Ask anything, or drop a document to turn it into notes, quizzes and flashcards.
          </p>
        </div>

        <AdaptiveErrorBoundary
          mode="manual"
          severity="medium"
          title="Input Area Unavailable"
          description="An error occurred while loading the chat input or file uploader. Please refresh the page to continue."
          theme={{
            backgroundColor: "#ffffff",
            textColor: "#0f172a",
            primaryColor: "#1d4ed8",
            fontFamily: "'Schibsted Grotesk', sans-serif",
            borderRadius: "24px"
          }}
        >
          <PromptBox
            value={prompt}
            onChange={setPrompt}
            onSend={() => onSend()}
            onPickFile={onPickFile}
            onRemoveFile={onRemoveFile}
            stagedFileName={stagedFile?.name || null}
            busy={busy}
            onDragOver={onDropZoneDragOver}
            onDrop={onDropZoneDrop}
          />
        </AdaptiveErrorBoundary>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMode(!showMode)}
              className="flex items-center gap-2 rounded-full border border-stone-900 bg-stone-950 px-3 py-2 text-xs transition-colors hover:bg-stone-900"
              aria-haspopup="listbox"
              aria-expanded={showMode}
            >
              <span className="text-stone-400">Mode</span>
              <span className="font-semibold text-white">{mode}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="size-3.5 text-stone-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showMode && (
              <div className="absolute left-0 top-full z-20 mt-1 w-36 rounded-2xl border border-stone-800 bg-stone-950 p-1 shadow-xl">
                {["Chat", "Quiz"].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => {
                      setMode(opt as "Chat" | "Quiz");
                      setShowMode(false);
                    }}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-stone-900 ${
                      mode === opt ? "font-semibold text-sky-500" : "text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLength(!showLength)}
              className="flex items-center gap-2 rounded-full border border-stone-900 bg-stone-950 px-3 py-2 text-xs transition-colors hover:bg-stone-900"
              aria-haspopup="listbox"
              aria-expanded={showLength}
            >
              <span className="text-stone-400">Length</span>
              <span className="font-semibold text-white">{responseLength}</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="size-3.5 text-stone-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>

            {showLength && (
              <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-2xl border border-stone-800 bg-stone-950 p-1 shadow-xl">
                {["Short", "Medium", "Long"].map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => {
                      setResponseLength(opt as "Short" | "Medium" | "Long");
                      setShowLength(false);
                    }}
                    className={`block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-stone-900 ${
                      responseLength === opt ? "font-semibold text-sky-500" : "text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onPickFile}
            className="flex items-center gap-2 rounded-full border border-stone-900 bg-stone-950 px-3 py-2 text-xs transition-colors hover:bg-stone-900 md:hidden"
            title={stagedFile ? stagedFile.name : "Attach a document"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-4 text-stone-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
            </svg>
            <span className="font-semibold text-white">{stagedFile ? "Replace" : "Attach"}</span>
          </button>

          <PromptRail onSend={(p) => onSend(p)} />
        </div>
      </div>

      <ExploreTopics />

      <input ref={fileRef} type="file" className="hidden" onChange={onFileChange} />
    </div>
  );
}
