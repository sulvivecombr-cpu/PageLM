import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  connectStudioStream,
  createFlashcard,
  listSources,
  studioStart,
  type LearningMode,
  type LearningTemplate,
  type QuizDifficulty,
  type QuizLanguage,
  type QuizLength,
  type QuizQuestionType,
  type SourceItem,
  type StudioEvent,
  type StudioFlashcard,
  type StudioKind,
  type StudioOptions,
  type StudioPayload,
  type StudioQuizSettings,
} from "../lib/api";
import MarkdownView from "../components/Chat/MarkdownView";
import MindMapView from "../components/Studio/MindMapView";

const KIND_LABEL: Record<StudioKind, string> = {
  quiz: "Quiz rápido",
  qcm: "QCM completo",
  flashcards: "Flashcards",
  summary: "Resumo inteligente",
  mindmap: "Mapa mental",
  learning: "Material de estudo",
};

const ACTIONS: Array<{
  kind: StudioKind;
  title: string;
  desc: string;
  badge: string;
  accent: string;
  ring: string;
}> = [
  {
    kind: "quiz",
    title: "Quiz",
    desc: "Quiz personalizável: quantidade, dificuldade, dicas e número de opções.",
    badge: "Personalizável",
    accent: "from-sky-500/20 via-sky-500/5 to-transparent",
    ring: "group-hover:border-sky-500/50 group-hover:shadow-sky-500/10",
  },
  {
    kind: "mindmap",
    title: "Mapa mental",
    desc: "Mapa mental interativo que conecta conceitos e revela as relações entre eles.",
    badge: "Interativo",
    accent: "from-rose-500/20 via-rose-500/5 to-transparent",
    ring: "group-hover:border-rose-500/50 group-hover:shadow-rose-500/10",
  },
  {
    kind: "flashcards",
    title: "Flashcards",
    desc: "8 flashcards para virar e memorizar.",
    badge: "8 cartões",
    accent: "from-violet-500/20 via-violet-500/5 to-transparent",
    ring: "group-hover:border-violet-500/50 group-hover:shadow-violet-500/10",
  },
  {
    kind: "learning",
    title: "Material de estudo",
    desc: "Resumo, aula completa, série de exercícios ou de perguntas — com modelos prontos.",
    badge: "4 modos",
    accent: "from-amber-500/20 via-amber-500/5 to-transparent",
    ring: "group-hover:border-amber-500/50 group-hover:shadow-amber-500/10",
  },
];

const DEFAULT_QUIZ_SETTINGS: StudioQuizSettings = {
  count: 10,
  difficulty: "medium",
  length: "medium",
  hints: true,
  optionsCount: 4,
  questionType: "mcq",
  language: "auto",
  mode: "practice",
};

const LEARNING_MODES: Array<{ value: LearningMode; label: string; desc: string }> = [
  { value: "summary", label: "Resumo", desc: "Principais conceitos e pontos de revisão" },
  { value: "lesson", label: "Aula completa", desc: "Explicação progressiva com exemplos resolvidos" },
  { value: "exercises", label: "Exercícios", desc: "Série de exercícios com soluções" },
  { value: "questions", label: "Perguntas", desc: "Perguntas de revisão e respostas modelo" },
];

const LEARNING_TEMPLATES: Array<{ value: LearningTemplate; label: string; desc: string }> = [
  { value: "pedagogical", label: "Pedagógico detalhado", desc: "Competências, eixos, exemplos e exercícios resolvidos" },
  { value: "academic", label: "Acadêmico", desc: "Organizado e detalhado" },
  { value: "exam", label: "Preparação para prova", desc: "Baseado no que é avaliado" },
  { value: "quick", label: "Revisão rápida", desc: "Focado e curto" },
];

const DIFFICULTY_LABEL = { easy: "Fácil", medium: "Médio", hard: "Difícil" } as const;
const LENGTH_LABEL = { short: "Curto", medium: "Médio", long: "Longo" } as const;
const QUESTION_TYPE_LABEL = { mcq: "Múltipla escolha", truefalse: "Verdadeiro ou falso", mixed: "Misto" } as const;
const LANGUAGE_LABEL: Record<QuizLanguage, string> = {
  auto: "Automático (segue a fonte)",
  ar: "Árabe",
  fr: "Francês",
  en: "Inglês",
};
const LEARNING_MODE_LABEL: Record<LearningMode, string> = {
  summary: "Resumo",
  lesson: "Aula completa",
  exercises: "Exercícios",
  questions: "Perguntas",
};
const LEARNING_TEMPLATE_LABEL: Record<LearningTemplate, string> = {
  quick: "Revisão rápida",
  academic: "Acadêmico",
  exam: "Preparação para prova",
  pedagogical: "Pedagógico detalhado",
};

const DIFFICULTY_OPTIONS: Array<{ value: QuizDifficulty; label: string }> = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Médio" },
  { value: "hard", label: "Difícil" },
];

const LENGTH_OPTIONS: Array<{ value: QuizLength; label: string }> = [
  { value: "short", label: "Curto" },
  { value: "medium", label: "Médio" },
  { value: "long", label: "Longo" },
];

const QTYPE_OPTIONS: Array<{ value: QuizQuestionType; label: string }> = [
  { value: "mcq", label: "Múltipla escolha" },
  { value: "truefalse", label: "Verdadeiro ou falso" },
  { value: "mixed", label: "Misto" },
];

const LANGUAGE_OPTIONS: Array<{ value: QuizLanguage; label: string }> = [
  { value: "auto", label: "Automático" },
  { value: "ar", label: "Árabe" },
  { value: "fr", label: "Francês" },
  { value: "en", label: "Inglês" },
];

const OPTION_COUNT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
];

const STEPS = ["Lendo a fonte", "Extraindo conceitos", "Redigindo o conteúdo", "Revisando a qualidade"];

function friendlyError(raw: string) {
  const s = String(raw || "");
  if (/429|quota|resource[_ ]exhausted|rate limit|too many requests/i.test(s)) {
    return "A cota da IA foi atingida temporariamente (429). Aguarde um ou dois minutos e tente de novo — sua fonte está salva, não precisa enviá-la outra vez.";
  }
  if (/timeout|timed out/i.test(s)) {
    return "A geração demorou mais que o esperado. Tente novamente ou use uma fonte menor.";
  }
  if (/invalid .*json|empty .* from model/i.test(s)) {
    return "O conteúdo não foi concluído em um formato válido desta vez. Clique em «Tentar de novo» — normalmente a segunda tentativa funciona.";
  }
  if (/source not found|source is empty|missing|no valid content/i.test(s)) {
    return "Não foi possível ler o texto desta fonte. Envie-a novamente na página de fontes e tente outra vez.";
  }
  return s;
}

function ActionIcon({ kind, className = "" }: { kind: StudioKind; className?: string }) {
  if (kind === "quiz") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
      </svg>
    );
  }
  if (kind === "qcm") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    );
  }
  if (kind === "flashcards") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
      </svg>
    );
  }
  if (kind === "mindmap") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
        <circle cx="12" cy="12" r="2.5" />
        <circle cx="5" cy="5" r="2" />
        <circle cx="19" cy="5" r="2" />
        <circle cx="5" cy="19" r="2" />
        <circle cx="19" cy="19" r="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m10.2 10.2-3.6-3.6M13.8 10.2l3.6-3.6M10.2 13.8l-3.6 3.6M13.8 13.8l3.6 3.6" />
      </svg>
    );
  }
  if (kind === "learning") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25h-3.5A2.25 2.25 0 0 0 4.375 4.5v15A2.25 2.25 0 0 0 6.625 21.75h10.75a2.25 2.25 0 0 0 2.25-2.25v-3.375M8.25 7.5h3M8.25 11.25h6M8.25 15h4.5" />
    </svg>
  );
}

function fmtBytes(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / Math.pow(1024, i);
  return `${v >= 10 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`;
}

function PillGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-xl border px-3.5 py-2 text-sm transition-colors ${
            value === o.value
              ? "border-sky-500/50 bg-sky-500/15 text-sky-200"
              : "border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700 hover:text-stone-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${
        checked ? "border-emerald-500/50 bg-emerald-500/30" : "border-stone-700 bg-stone-800"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white transition-all duration-200 ${
          checked ? "left-6" : "left-0.5"
        }`}
      />
    </button>
  );
}

const PARTICLES = [
  { left: "12%", top: "18%", size: 5, dx: "-18px", dy: "-90px", delay: "0s", dur: "4.2s" },
  { left: "22%", top: "72%", size: 4, dx: "12px", dy: "-110px", delay: "1.1s", dur: "5.1s" },
  { left: "38%", top: "8%", size: 3, dx: "-10px", dy: "-70px", delay: "2.2s", dur: "3.8s" },
  { left: "58%", top: "84%", size: 5, dx: "20px", dy: "-120px", delay: "0.6s", dur: "5.6s" },
  { left: "72%", top: "22%", size: 3, dx: "-16px", dy: "-80px", delay: "1.8s", dur: "4.6s" },
  { left: "86%", top: "64%", size: 4, dx: "14px", dy: "-100px", delay: "2.8s", dur: "5.2s" },
  { left: "48%", top: "46%", size: 2, dx: "-8px", dy: "-60px", delay: "3.3s", dur: "3.6s" },
  { left: "66%", top: "52%", size: 3, dx: "18px", dy: "-90px", delay: "1.5s", dur: "4.9s" },
];

function SourceIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25h-3.5A2.25 2.25 0 0 0 4.375 4.5v15A2.25 2.25 0 0 0 6.625 21.75h10.75a2.25 2.25 0 0 0 2.25-2.25v-3.375" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 12h7.5M8.25 15.75h4.5" />
    </svg>
  );
}

export default function Studio() {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(search.get("sourceId") || "");
  const [loadError, setLoadError] = useState("");

  const [kind, setKind] = useState<StudioKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<StudioPayload | null>(null);
  const [error, setError] = useState("");
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [docCopied, setDocCopied] = useState(false);
  const [settingsFor, setSettingsFor] = useState<"quiz" | "learning" | null>(null);
  const [quizSettings, setQuizSettings] = useState<StudioQuizSettings>(DEFAULT_QUIZ_SETTINGS);
  const [learningMode, setLearningMode] = useState<LearningMode>("summary");
  const [learningTemplate, setLearningTemplate] = useState<LearningTemplate>("pedagogical");
  const [learningDifficulty, setLearningDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [learningAnswers, setLearningAnswers] = useState(true);
  const [activeOptions, setActiveOptions] = useState<StudioOptions>({});

  const wsRef = useRef<{ close: () => void } | null>(null);
  const timersRef = useRef<number[]>([]);

  const selected = useMemo(
    () => sources.find((s) => s.id === selectedId) || sources[0] || null,
    [sources, selectedId],
  );

  const clearTimers = () => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  };

  const closeWs = () => {
    try { wsRef.current?.close(); } catch { }
    wsRef.current = null;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await listSources();
        const list = res.sources || [];
        setSources(list);
        const fromUrl = search.get("sourceId");
        if (fromUrl && list.some((s) => s.id === fromUrl)) setSelectedId(fromUrl);
        else if (list.length) setSelectedId((prev) => (list.some((s) => s.id === prev) ? prev : list[0].id));
      } catch (e: any) {
        setLoadError(e?.message || "Não foi possível carregar as fontes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selected) return;
    if (selected.id !== selectedId) setSelectedId(selected.id);
    if (search.get("sourceId") !== selected.id) {
      setSearch({ sourceId: selected.id }, { replace: true });
    }
  }, [selected, selectedId, search, setSearch]);

  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const tick = () => {
      const secs = (Date.now() - started) / 1000;
      const p = 6 + 90 * (1 - Math.exp(-secs / 24));
      setProgress((prev) => Math.max(prev, Math.min(97, p)));
    };
    tick();
    const iv = window.setInterval(tick, 420);
    return () => window.clearInterval(iv);
  }, [busy]);

  useEffect(() => () => { closeWs(); clearTimers(); }, []);

  const activeStep = progress < 24 ? 0 : progress < 54 ? 1 : progress < 82 ? 2 : 3;

  const resetRun = () => {
    closeWs();
    clearTimers();
    setBusy(false);
    setKind(null);
    setProgress(0);
    setResult(null);
    setError("");
    setFlipped({});
    setSaved(false);
    setSaving(false);
    setCopied(false);
  };

  const start = async (k: StudioKind, options: StudioOptions = {}) => {
    if (!selected || busy) return;
    closeWs();
    clearTimers();
    setKind(k);
    setActiveOptions(options);
    setResult(null);
    setError("");
    setBusy(true);
    setProgress(6);
    setFlipped({});
    setSaved(false);

    try {
      const res = await studioStart(selected.id, k, options);
      const { close } = connectStudioStream(res.jobId, (ev: StudioEvent) => {
        if (ev.type === "result") {
          setResult(ev.payload);
          setProgress(100);
          window.setTimeout(() => setBusy(false), 350);
          close();
        }
        if (ev.type === "error") {
          setError(ev.error || "Não foi possível gerar");
          setBusy(false);
          close();
        }
      });
      wsRef.current = { close };
    } catch (e: any) {
      setError(e?.message || "Não foi possível iniciar a geração");
      setBusy(false);
    }
  };

  const cancel = () => {
    resetRun();
  };

  const saveCards = async (cards: StudioFlashcard[]) => {
    if (saving || saved) return;
    setSaving(true);
    try {
      await Promise.all(cards.map((c) => createFlashcard({ question: c.q, answer: c.a, tag: "studio" })));
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const copySummary = async (md: string) => {
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      const t = window.setTimeout(() => setCopied(false), 1800);
      timersRef.current.push(t);
    } catch { }
  };

  const openSettings = (k: StudioKind) => {
    if (k === "quiz") return setSettingsFor("quiz");
    if (k === "learning") return setSettingsFor("learning");
    start(k);
  };

  const launchQuiz = () => {
    setSettingsFor(null);
    start("quiz", { ...quizSettings });
  };

  const launchLearning = () => {
    setSettingsFor(null);
    start("learning", {
      learningMode,
      template: learningTemplate,
      difficulty: learningDifficulty,
      answers: learningAnswers,
    });
  };

  const downloadMarkdown = (filename: string, md: string) => {
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyLearning = async (md: string) => {
    try {
      await navigator.clipboard.writeText(md);
      setDocCopied(true);
      const t = window.setTimeout(() => setDocCopied(false), 1800);
      timersRef.current.push(t);
    } catch { }
  };

  const startQuiz = () => {
    if (!result || (result.kind !== "quiz" && result.kind !== "qcm") || !selected) return;
    const questions = result.questions.map((q) => ({
      ...q,
      correct: Math.max(0, Math.min(q.options.length - 1, (q.correct || 1) - 1)),
    }));
    navigate("/quiz", {
      state: {
        topic: selected.name,
        questions,
        mode: result.kind === "qcm" || result.settings?.mode === "exam" ? "qcm" : "quiz",
        sourceId: selected.id,
      },
    });
  };

  return (
    <div className="min-h-screen w-full pl-4 pr-4 md:pl-32">
      <div className="max-w-6xl mx-auto pt-8 pb-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium mb-3">
              <span className="size-1.5 rounded-full bg-violet-400 animate-pulse" />
              Terceira etapa · Estúdio
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">Estúdio de geração</h1>
            <p className="text-stone-400 mt-2 max-w-2xl leading-relaxed">
              Escolha uma fonte e depois o que quer criar a partir dela. Tudo é baseado no conteúdo do seu arquivo — nada de suposições genéricas.
            </p>
          </div>
          <Link
            to="/sources"
            className="inline-flex items-center justify-center gap-2 self-start sm:self-auto rounded-2xl border border-stone-800 bg-stone-950 hover:bg-stone-900 hover:border-stone-700 px-4 py-2.5 text-sm text-stone-300 transition-colors"
          >
            <SourceIcon className="size-4" />
            Gerenciar fontes
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-24 rounded-3xl bg-stone-950 border border-stone-900 animate-pulse" />
            <div className="h-72 rounded-3xl bg-stone-950 border border-stone-900 animate-pulse" />
          </div>
        ) : !sources.length ? (
          <div className="relative overflow-hidden rounded-3xl border border-stone-800 bg-stone-950 p-10 sm:p-16 text-center">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 size-96 rounded-full bg-violet-500/10 blur-3xl studio-glow" />
            <div className="relative">
              <div className="mx-auto size-20 rounded-3xl border border-stone-800 bg-stone-900/80 flex items-center justify-center mb-6 studio-float">
                <SourceIcon className="size-9 text-violet-300" />
              </div>
              <h2 className="text-2xl font-semibold text-white">O estúdio precisa de uma fonte primeiro</h2>
              <p className="text-stone-400 mt-2 max-w-lg mx-auto leading-relaxed">
                Envie seu arquivo na página de fontes e volte aqui para gerar um quiz, flashcards, um mapa mental ou um material de estudo a partir dele.
              </p>
              <Link
                to="/sources"
                className="inline-flex items-center gap-2 mt-6 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 px-6 py-3 text-white font-medium transition-all duration-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Envie sua primeira fonte
              </Link>
            </div>
          </div>
        ) : (
          <>
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-300">1 · Escolha a fonte</h2>
                {selected && <span className="text-xs text-stone-500">{fmtBytes(selected.size)} · {selected.chars.toLocaleString("pt-BR")} caracteres</span>}
              </div>
              <div className="flex gap-3 overflow-x-auto custom-scroll pb-2">
                {sources.map((src) => {
                  const active = selected?.id === src.id;
                  return (
                    <button
                      key={src.id}
                      onClick={() => { if (!busy) { setSelectedId(src.id); resetRun(); } }}
                      disabled={busy}
                      className={`shrink-0 w-64 text-left rounded-2xl border p-3.5 transition-all duration-300 ${
                        active
                          ? "border-sky-500/50 bg-gradient-to-br from-sky-500/15 to-violet-500/10 shadow-lg shadow-sky-500/10"
                          : "border-stone-800 bg-stone-950 hover:border-stone-700 hover:bg-stone-900/60"
                      } disabled:opacity-60`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl border flex items-center justify-center ${active ? "border-sky-400/40 bg-sky-500/15 text-sky-300" : "border-stone-800 bg-stone-900 text-stone-400"}`}>
                          <SourceIcon className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white truncate" dir="auto">{src.name}</div>
                          <div className="text-[11px] text-stone-500">{fmtBytes(src.size)} · {src.chars.toLocaleString("pt-BR")} caracteres</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-300">2 · Escolha o que criar</h2>
                {selected && <span className="text-xs text-stone-500 truncate max-w-[45%]" dir="auto">Fonte: {selected.name}</span>}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACTIONS.map((a) => (
                  <button
                    key={a.kind}
                    onClick={() => openSettings(a.kind)}
                    disabled={busy || !selected}
                    className={`group relative text-left overflow-hidden rounded-3xl border border-stone-800 bg-stone-950 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:hover:translate-y-0 ${a.ring}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${a.accent} opacity-80`} />
                    <div className="relative">
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2.5 rounded-xl border border-stone-700/70 bg-stone-900/70 text-stone-200 group-hover:text-white transition-colors">
                          <ActionIcon kind={a.kind} className="size-6" />
                        </div>
                        <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-black/30 border border-white/10 text-stone-300">{a.badge}</span>
                      </div>
                      <div className="mt-4 text-lg font-semibold text-white">{a.title}</div>
                      <div className="mt-1 text-xs leading-relaxed text-stone-400 min-h-[2.6rem]">{a.desc}</div>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-stone-300 group-hover:text-white transition-colors">
                        Começar a gerar
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-3.5 transition-transform group-hover:-translate-x-0.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {selected && (
              <div className="rounded-2xl border border-stone-900 bg-stone-950/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-2 text-stone-400">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  O conteúdo será criado exclusivamente a partir desta fonte:
                </div>
                <div className="text-stone-200 truncate" dir="auto">{selected.name}</div>
                <div className="sm:ms-auto flex gap-3 text-xs">
                  <Link to={`/chat?sourceId=${encodeURIComponent(selected.id)}`} className="text-sky-300 hover:text-sky-200">Perguntar à fonte</Link>
                  <Link to="/sources" className="text-stone-400 hover:text-stone-200">Trocar fonte</Link>
                </div>
              </div>
            )}

            {error && !busy && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
                <div className="font-semibold text-red-200">Não foi possível concluir a geração</div>
                <div className="text-sm text-red-300/80 mt-1" dir="auto">{friendlyError(error)}</div>
                <div className="mt-3 flex gap-2">
                  {kind && <button onClick={() => start(kind, activeOptions)} className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-2 text-sm text-red-200 hover:bg-red-500/30">Tentar de novo</button>}
                  <button onClick={resetRun} className="rounded-xl bg-stone-900 border border-stone-800 px-4 py-2 text-sm text-stone-300 hover:bg-stone-800">Voltar</button>
                </div>
              </div>
            )}

            {busy && kind && selected && (
              <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="studio-result w-full max-w-5xl overflow-hidden rounded-3xl border border-stone-800 bg-stone-950 shadow-2xl shadow-black/60">
                  <div className="relative overflow-hidden">
                    <div className="absolute inset-0 studio-grid opacity-40" />
                    <div className="absolute -top-28 -left-24 size-80 rounded-full bg-sky-500/15 blur-3xl" />
                    <div className="absolute -bottom-32 -right-20 size-96 rounded-full bg-violet-500/15 blur-3xl" />

                    <div className="relative grid lg:grid-cols-[1fr_1.1fr] gap-6 p-6 sm:p-10 items-center">
                      <div className="relative h-80 flex items-center justify-center">
                        {PARTICLES.map((p, i) => (
                          <span
                            key={i}
                            className="studio-particle absolute rounded-full bg-sky-300/80 shadow-[0_0_12px_rgba(125,211,252,0.8)]"
                            style={{
                              left: p.left,
                              top: p.top,
                              width: p.size,
                              height: p.size,
                              "--dx": p.dx,
                              "--dy": p.dy,
                              "--delay": p.delay,
                              "--dur": p.dur,
                            } as CSSProperties}
                          />
                        ))}
                        <div className="absolute size-72 rounded-full border border-sky-500/15 studio-orbit-slow" />
                        <div className="absolute size-56 rounded-full border border-dashed border-violet-500/25 studio-orbit-rev" />
                        <div className="absolute size-64 rounded-full bg-sky-500/10 blur-3xl studio-glow" />
                        <div className="absolute size-40 rounded-full bg-violet-500/10 blur-2xl studio-glow" />

                        <div className="relative studio-float">
                          <div className="relative w-44 h-56 rounded-3xl border border-stone-700 bg-gradient-to-br from-stone-900 via-stone-950 to-black shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden">
                            <div className="p-5 space-y-2.5">
                              <div className="h-2.5 w-24 rounded bg-sky-400/50" />
                              <div className="h-1.5 w-32 rounded bg-stone-700" />
                              <div className="h-1.5 w-28 rounded bg-stone-800" />
                              <div className="mt-4 grid grid-cols-2 gap-2">
                                <div className="h-8 rounded-lg bg-stone-800/80" />
                                <div className="h-8 rounded-lg bg-stone-800/80" />
                              </div>
                              <div className="h-1.5 w-36 rounded bg-stone-800" />
                              <div className="h-1.5 w-24 rounded bg-stone-800" />
                              <div className="mt-2 h-1.5 w-32 rounded bg-violet-400/30" />
                            </div>
                            <div className="absolute inset-x-0 h-20 bg-gradient-to-b from-transparent via-sky-400/15 to-transparent studio-scanline" />
                            <div className="absolute inset-x-0 h-px bg-sky-300/90 shadow-[0_0_22px_5px_rgba(56,189,248,0.55)] studio-scanline" />
                          </div>
                          <div className="absolute -right-5 -top-5 size-10 rounded-2xl border border-violet-400/30 bg-violet-500/15 backdrop-blur flex items-center justify-center studio-float" style={{ animationDelay: "0.7s" }}>
                            <ActionIcon kind={kind} className="size-5 text-violet-200" />
                          </div>
                        </div>

                        <div className="absolute size-80 rounded-full studio-orbit-slow">
                          <span className="absolute top-0 left-1/2 -translate-x-1/2 size-2.5 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.9)]" />
                        </div>
                        <div className="absolute size-64 rounded-full studio-orbit-rev">
                          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 size-2 rounded-full bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.9)]" />
                        </div>
                      </div>

                      <div>
                        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-sky-300/80">
                          <span className="size-1.5 rounded-full bg-sky-400 animate-pulse" />
                          Gerando · {KIND_LABEL[kind]}
                        </div>
                        <h3 className="mt-2 text-2xl sm:text-3xl font-semibold text-white leading-snug">
                          Criando {KIND_LABEL[kind]} para você
                          <span className="block text-lg sm:text-xl font-normal text-stone-400 mt-1">A partir da sua fonte, com alta qualidade</span>
                        </h3>

                        <div className="mt-4 flex items-center gap-2 text-sm text-stone-400 min-w-0">
                          <SourceIcon className="size-4 shrink-0 text-stone-500" />
                          <span className="truncate" dir="auto">{selected.name}</span>
                        </div>

                        <div className="mt-6">
                          <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                            <span>{STEPS[activeStep]}</span>
                            <span className="tabular-nums">{Math.round(progress)}%</span>
                          </div>
                          <div className="relative h-2 rounded-full bg-stone-900 overflow-hidden border border-stone-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-violet-500 transition-all duration-500 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                            <div className="absolute inset-0 studio-shine" />
                          </div>
                        </div>

                        <div className="mt-6 space-y-2.5">
                          {STEPS.map((s, i) => {
                            const done = i < activeStep;
                            const active = i === activeStep;
                            return (
                              <div key={s} className={`flex items-center gap-3 text-sm transition-colors ${done ? "text-stone-300" : active ? "text-white" : "text-stone-600"}`}>
                                <span className={`relative size-6 rounded-full border flex items-center justify-center ${done ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : active ? "border-sky-400/50 bg-sky-500/15 text-sky-300" : "border-stone-800 bg-stone-900 text-stone-600"}`}>
                                  {done ? (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                  ) : active ? (
                                    <span className="size-2 rounded-full bg-sky-300 animate-ping" />
                                  ) : (
                                    <span className="size-1.5 rounded-full bg-stone-700" />
                                  )}
                                </span>
                                <span className={active ? "studio-step-active font-medium" : ""}>{s}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-3">
                          <span className="text-xs text-stone-500">Pode levar de 10 a 60 segundos, dependendo do tamanho da fonte.</span>
                          <button onClick={cancel} className="rounded-xl border border-stone-800 bg-stone-900/80 px-4 py-2 text-xs text-stone-300 hover:bg-stone-800 transition-colors">
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {result && selected && !busy && (
              <div className="mt-8 studio-result">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl border border-emerald-500/30 bg-emerald-500/15 flex items-center justify-center text-emerald-300">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold">{KIND_LABEL[result.kind]} criado</div>
                      <div className="text-xs text-stone-500" dir="auto">
                        {selected.name} · {selected.chars.toLocaleString("pt-BR")} caracteres · gerado agora a partir da fonte
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={resetRun} className="rounded-xl border border-stone-800 bg-stone-950 px-3.5 py-2 text-xs text-stone-300 hover:bg-stone-900">Outro tipo</button>
                    <button onClick={() => start(result.kind, activeOptions)} className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2 text-xs text-sky-200 hover:bg-sky-500/20">Nova versão</button>
                  </div>
                </div>

                {(result.kind === "quiz" || result.kind === "qcm") && (
                  <div className="relative overflow-hidden rounded-3xl border border-stone-800 bg-stone-950 p-6 sm:p-8">
                    <div className="absolute -top-24 -right-20 size-72 rounded-full bg-sky-500/10 blur-3xl" />
                    <div className="relative">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="text-xs text-sky-300 font-medium">
                            {result.kind === "qcm" || result.settings?.mode === "exam" ? "Modo prova" : "Modo treino"}
                          </div>
                          <h3 className="text-2xl font-semibold text-white mt-1">{result.questions.length} perguntas prontas</h3>
                          <p className="text-stone-400 text-sm mt-1" dir="auto">
                            {result.settings
                              ? `${DIFFICULTY_LABEL[result.settings.difficulty]} · ${LENGTH_LABEL[result.settings.length]} · ${QUESTION_TYPE_LABEL[result.settings.questionType]} · ${LANGUAGE_LABEL[result.settings.language] ?? LANGUAGE_LABEL.auto} · ${
                                  result.settings.hints ? "dicas ativadas" : "sem dicas"
                                } · ${result.settings.optionsCount} opções`
                              : "Múltipla escolha, com correção imediata e revisão completa no final."}
                          </p>
                        </div>
                        <button
                          onClick={startQuiz}
                          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 px-6 py-3 text-white font-medium transition-all duration-300"
                        >
                          Começar o quiz agora
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                      </div>
                      <div className="mt-5 grid gap-2">
                        {result.questions.slice(0, 3).map((q, i) => (
                          <div key={q.id || i} className="flex items-start gap-3 rounded-xl border border-stone-900 bg-stone-900/40 px-3.5 py-2.5">
                            <span className="size-5 shrink-0 rounded-full bg-stone-800 text-[11px] text-stone-300 flex items-center justify-center mt-0.5">{i + 1}</span>
                            <span className="text-sm text-stone-300 line-clamp-2" dir="auto">{q.question}</span>
                          </div>
                        ))}
                        {result.questions.length > 3 && <div className="text-xs text-stone-500 pl-8">+ {result.questions.length - 3} perguntas a mais…</div>}
                      </div>
                    </div>
                  </div>
                )}

                {result.kind === "flashcards" && (
                  <div className="rounded-3xl border border-stone-800 bg-stone-950 p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{result.cards.length} flashcards prontos</h3>
                        <p className="text-xs text-stone-500 mt-1">Clique em qualquer cartão para virá-lo e ver a resposta.</p>
                      </div>
                      <button
                        onClick={() => saveCards(result.cards)}
                        disabled={saving || saved}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${saved ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-stone-700 bg-stone-900 text-stone-200 hover:bg-stone-800"}`}
                      >
                        {saved ? "Salvo na mochila ✓" : saving ? "Salvando…" : "Salvar tudo na mochila"}
                      </button>
                    </div>
                    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {result.cards.map((card, i) => (
                        <div key={i} className="[perspective:1200px]">
                          <button
                            onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                            className={`studio-flip relative h-52 w-full text-left ${flipped[i] ? "is-flipped" : ""}`}
                            aria-label={`Cartão ${i + 1}`}
                          >
                            <div className="studio-flip-face absolute inset-0 rounded-2xl border border-stone-800 bg-gradient-to-br from-stone-900 to-stone-950 p-5 flex flex-col justify-between">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] uppercase tracking-wider text-sky-300/80">Pergunta {i + 1}</span>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-4 text-stone-600">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                              </div>
                              <p className="text-sm text-stone-200 leading-relaxed line-clamp-6" dir="auto">{card.q}</p>
                              <span className="text-[10px] text-stone-600">Clique para virar</span>
                            </div>
                            <div className="studio-flip-face studio-flip-back absolute inset-0 rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-500/15 via-stone-950 to-stone-950 p-5 flex flex-col justify-between">
                              <span className="text-[10px] uppercase tracking-wider text-violet-300/80">Resposta</span>
                              <p className="text-sm text-stone-100 leading-relaxed line-clamp-6" dir="auto">{card.a}</p>
                              <div className="flex flex-wrap gap-1">
                                {(card.tags || []).slice(0, 3).map((t) => (
                                  <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-stone-400">{t}</span>
                                ))}
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.kind === "summary" && (
                  <div className="rounded-3xl border border-stone-800 bg-stone-950 p-5 sm:p-8">
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Resumo da fonte</h3>
                        <p className="text-xs text-stone-500 mt-1">Baseado no conteúdo do arquivo, com pontos de revisão e perguntas de compreensão.</p>
                      </div>
                      <button onClick={() => copySummary(result.markdown)} className="rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-xs text-stone-300 hover:bg-stone-800">
                        {copied ? "Copiado ✓" : "Copiar resumo"}
                      </button>
                    </div>
                    <div className="rounded-2xl border border-stone-900 bg-black/30 p-4 sm:p-6 max-h-[70vh] overflow-y-auto custom-scroll">
                      <MarkdownView md={result.markdown} />
                    </div>
                  </div>
                )}

                {result.kind === "learning" && (
                  <div className="rounded-3xl border border-stone-800 bg-stone-950 p-5 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                      <div>
                        <div className="text-xs text-amber-300 font-medium">
                          {LEARNING_MODE_LABEL[result.mode]} · {LEARNING_TEMPLATE_LABEL[result.template]}
                        </div>
                        <h3 className="text-lg font-semibold text-white mt-1">Material de estudo pronto</h3>
                        <p className="text-xs text-stone-500 mt-1">Baseado no conteúdo do arquivo, pronto para ler, baixar ou imprimir.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => copyLearning(result.markdown)}
                          className="rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-xs text-stone-300 hover:bg-stone-800"
                        >
                          {docCopied ? "Copiado ✓" : "Copiar"}
                        </button>
                        <button
                          onClick={() => downloadMarkdown(`${selected.name.replace(/\.[^.]+$/, "")}-learning.md`, result.markdown)}
                          className="rounded-xl border border-stone-800 bg-stone-900 px-3.5 py-2 text-xs text-stone-300 hover:bg-stone-800"
                        >
                          Baixar Markdown
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs text-amber-200 hover:bg-amber-500/20"
                        >
                          Imprimir / PDF
                        </button>
                      </div>
                    </div>
                    <article id="learning-print-area" className="rounded-2xl border border-stone-900 bg-black/30 p-4 sm:p-6 max-h-[70vh] overflow-y-auto custom-scroll print:max-h-none print:overflow-visible">
                      <MarkdownView md={result.markdown} />
                    </article>
                  </div>
                )}

                {result.kind === "mindmap" && <MindMapView map={result.mindmap} />}
              </div>
            )}
          </>
        )}

        {loadError && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{loadError}</div>
        )}

        {settingsFor && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSettingsFor(null)}
          >
            <div
              dir="ltr"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-stone-800 bg-stone-950 shadow-2xl shadow-black/70"
            >
              <div className="shrink-0 flex items-start justify-between gap-3 border-b border-stone-800 bg-stone-950/95 px-5 py-3.5 backdrop-blur">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {settingsFor === "quiz" ? "Configurações do quiz" : "Configurações do material de estudo"}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {settingsFor === "quiz"
                      ? "Personalize o quiz para o seu nível e objetivo."
                      : "Escolha o modo e o modelo que combinam com a sua forma de estudar."}
                  </p>
                </div>
                <button
                  onClick={() => setSettingsFor(null)}
                  aria-label="Fechar"
                  className="rounded-xl border border-stone-800 bg-stone-900 p-2 text-stone-400 hover:text-white hover:bg-stone-800"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scroll p-5 space-y-4">
                {settingsFor === "quiz" ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-stone-200">Número de perguntas</span>
                        <span className="text-sm font-semibold text-sky-300 tabular-nums">{quizSettings.count}</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={20}
                        step={1}
                        value={quizSettings.count}
                        onChange={(e) => setQuizSettings((s) => ({ ...s, count: Number(e.target.value) }))}
                        className="w-full accent-sky-500"
                      />
                      <div className="mt-1 flex justify-between text-[11px] text-stone-500">
                        <span>1</span>
                        <span>20</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-stone-200 mb-2">Dificuldade</div>
                      <PillGroup
                        value={quizSettings.difficulty}
                        options={DIFFICULTY_OPTIONS}
                        onChange={(v) => setQuizSettings((s) => ({ ...s, difficulty: v }))}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-medium text-stone-200 mb-2">Tamanho das perguntas</div>
                      <PillGroup
                        value={quizSettings.length}
                        options={LENGTH_OPTIONS}
                        onChange={(v) => setQuizSettings((s) => ({ ...s, length: v }))}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-medium text-stone-200 mb-2">Tipo de pergunta</div>
                      <PillGroup
                        value={quizSettings.questionType}
                        options={QTYPE_OPTIONS}
                        onChange={(v) =>
                          setQuizSettings((s) => ({
                            ...s,
                            questionType: v,
                            optionsCount: v === "truefalse" ? 2 : Math.max(2, s.optionsCount),
                          }))
                        }
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-stone-200">Idioma das perguntas</span>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                          Novo
                        </span>
                      </div>
                      <PillGroup
                        value={quizSettings.language}
                        options={LANGUAGE_OPTIONS}
                        onChange={(v) => setQuizSettings((s) => ({ ...s, language: v }))}
                      />
                      <p className="text-[11px] text-stone-500 mt-1.5">
                        «Automático» segue o idioma da fonte; você pode forçar árabe, francês ou inglês.
                      </p>
                    </div>

                    <div
                      className={`transition-opacity ${
                        quizSettings.questionType === "truefalse" ? "opacity-40 pointer-events-none" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-stone-200">Número de opções</span>
                        <span className="text-[11px] text-stone-500">
                          {quizSettings.questionType === "truefalse"
                            ? "Verdadeiro ou falso usa sempre duas opções"
                            : `1 resposta correta + ${Math.max(0, quizSettings.optionsCount - 1)} erradas`}
                        </span>
                      </div>
                      <PillGroup
                        value={String(quizSettings.optionsCount)}
                        options={OPTION_COUNT_OPTIONS}
                        onChange={(v) => setQuizSettings((s) => ({ ...s, optionsCount: Number(v) }))}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4 rounded-2xl border border-stone-800 bg-stone-900/40 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-stone-200">Dicas</div>
                        <div className="text-xs text-stone-500 mt-0.5">Um botão de dica que ajuda sem revelar a resposta.</div>
                      </div>
                      <Toggle
                        checked={quizSettings.hints}
                        onChange={(v) => setQuizSettings((s) => ({ ...s, hints: v }))}
                      />
                    </div>

                    <div>
                      <div className="text-sm font-medium text-stone-200 mb-2">Modo do quiz</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "practice", label: "Treino", desc: "Explicação após cada pergunta" },
                          { value: "exam", label: "Prova", desc: "Resultado no final" },
                        ].map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() =>
                              setQuizSettings((s) => ({ ...s, mode: m.value as "practice" | "exam" }))
                            }
                            className={`rounded-2xl border px-3.5 py-2.5 text-left transition-colors ${
                              quizSettings.mode === m.value
                                ? "border-sky-500/50 bg-sky-500/10"
                                : "border-stone-800 bg-stone-900/40 hover:border-stone-700"
                            }`}
                          >
                            <div className={`text-sm font-medium ${quizSettings.mode === m.value ? "text-sky-200" : "text-stone-300"}`}>
                              {m.label}
                            </div>
                            <div className="text-[11px] text-stone-500 mt-0.5">{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <div className="text-sm font-medium text-stone-200 mb-2">Modo do material</div>
                      <div className="grid grid-cols-2 gap-2">
                        {LEARNING_MODES.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setLearningMode(m.value)}
                            className={`rounded-2xl border px-3.5 py-2.5 text-left transition-colors ${
                              learningMode === m.value
                                ? "border-amber-500/50 bg-amber-500/10"
                                : "border-stone-800 bg-stone-900/40 hover:border-stone-700"
                            }`}
                          >
                            <div className={`text-sm font-medium ${learningMode === m.value ? "text-amber-200" : "text-stone-300"}`}>
                              {m.label}
                            </div>
                            <div className="text-[11px] text-stone-500 mt-0.5">{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-stone-200 mb-2">Modelo</div>
                      <div className="grid grid-cols-2 gap-2">
                        {LEARNING_TEMPLATES.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => setLearningTemplate(t.value)}
                            className={`rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                              learningTemplate === t.value
                                ? "border-amber-500/50 bg-amber-500/10"
                                : "border-stone-800 bg-stone-900/40 hover:border-stone-700"
                            }`}
                          >
                            <div className={`text-sm font-medium ${learningTemplate === t.value ? "text-amber-200" : "text-stone-300"}`}>
                              {t.label}
                            </div>
                            <div className="text-[11px] text-stone-500 mt-0.5">{t.desc}</div>
                          </button>
                        ))}
                      </div>
                      {learningMode === "lesson" && learningTemplate === "pedagogical" && (
                        <p className="text-[11px] leading-relaxed text-amber-300/70 mt-1.5">
                          Inclui: competências, introdução, eixos, definições, propriedades, exemplos, representação gráfica e exercícios resolvidos.
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="text-sm font-medium text-stone-200 mb-2">Nível</div>
                      <PillGroup
                        value={learningDifficulty}
                        options={DIFFICULTY_OPTIONS}
                        onChange={(v) => setLearningDifficulty(v)}
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4 rounded-2xl border border-stone-800 bg-stone-900/40 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-stone-200">Incluir respostas</div>
                        <div className="text-xs text-stone-500 mt-0.5">Soluções modelo para os exercícios e perguntas ao final do material.</div>
                      </div>
                      <Toggle checked={learningAnswers} onChange={setLearningAnswers} />
                    </div>
                  </>
                )}
              </div>

              <div className="shrink-0 flex gap-2 border-t border-stone-800 bg-stone-950/95 px-5 py-3.5 backdrop-blur">
                <button
                  onClick={() => setSettingsFor(null)}
                  className="rounded-xl border border-stone-800 bg-stone-900 px-4 py-2.5 text-sm text-stone-300 hover:bg-stone-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={settingsFor === "quiz" ? launchQuiz : launchLearning}
                  disabled={!selected || busy}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-violet-500 hover:from-sky-400 hover:to-violet-400 px-4 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-50"
                >
                  Gerar agora
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
