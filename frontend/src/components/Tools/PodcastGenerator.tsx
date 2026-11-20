import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { podcastStart, connectPodcastStream, type PodcastEvent } from "../../lib/api"

export default function PodcastGenerator() {
  const location = useLocation()
  const [topic, setTopic] = useState("")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("")
  const [audioFile, setAudioFile] = useState<string | null>(null)
  const [audioFilename, setAudioFilename] = useState<string | null>(null)

  useEffect(() => {
    // Check if we were navigated here with a podcast already started
    if (location.state?.podcastPid) {
      const { podcastPid, podcastTopic } = location.state
      setTopic(podcastTopic || "")
      setBusy(true)
      setStatus("Conectando à geração do podcast...")

      // Connect to the existing podcast stream
      const { close } = connectPodcastStream(podcastPid, (ev: PodcastEvent) => {
        if (ev.type === "ready") {
          setStatus("Conectado, gerando...")
        }
        if (ev.type === "phase") {
          setStatus(`Etapa: ${ev.value}`)
        }
        if (ev.type === "script") {
          setStatus("Roteiro pronto, criando o áudio...")
        }
        if (ev.type === "audio") {
          const audioUrl = ev.file || ev.staticUrl || ""
          setAudioFile(audioUrl)
          setAudioFilename(ev.filename || "podcast.mp3")
          setStatus("Pronto — o áudio está disponível!")
        }
        if (ev.type === "done") {
          setStatus("Concluído")
          setBusy(false)
          setTimeout(() => {
            close()
          }, 1000)
        }
        if (ev.type === "error") {
          setStatus(`Erro: ${ev.error}`)
          close()
          setBusy(false)
        }
      })

      const timeout = setTimeout(() => {
        setStatus("Erro: tempo esgotado — a geração demorou demais")
        setBusy(false)
        close()
      }, 120000)

      return () => {
        clearTimeout(timeout)
        close()
      }
    }
  }, [location.state])

  const onGenerate = async () => {
    if (!topic.trim() || busy) return

    setBusy(true)
    setStatus("Iniciando…")
    setAudioFile(null)
    setAudioFilename(null)

    try {
      const { pid } = await podcastStart({ topic })

      await new Promise(resolve => setTimeout(resolve, 100))

      const { close } = connectPodcastStream(pid, (ev: PodcastEvent) => {
        if (ev.type === "ready") {
          setStatus("Conectado, gerando...")
        }
        if (ev.type === "phase") {
          setStatus(`Etapa: ${ev.value}`)
        }
        if (ev.type === "script") {
          setStatus("Roteiro pronto, criando o áudio...")
        }
        if (ev.type === "audio") {
          const audioUrl = ev.file || ev.staticUrl || ""

          setAudioFile(audioUrl)
          setAudioFilename(ev.filename || "podcast.mp3")
          setStatus("Pronto — o áudio está disponível!")
        }
        if (ev.type === "done") {
          setStatus("Concluído")
          setBusy(false)
          setTimeout(() => {
            close()
          }, 1000)
        }
        if (ev.type === "error") {
          setStatus(`Erro: ${ev.error}`)
          close()
          setBusy(false)
        }
      })

      const timeout = setTimeout(() => {
        setStatus("Erro: tempo esgotado — a geração demorou demais")
        setBusy(false)
        close()
      }, 120000)

      const originalClose = close
      const closeWithCleanup = () => {
        clearTimeout(timeout)
        originalClose()
      }

      return { close: closeWithCleanup }
    } catch (e: unknown) {
      setStatus((e as Error).message || "Falhou")
      setBusy(false)
    }
  }

  return (
    <div className="group rounded-2xl bg-stone-950 border border-zinc-800 p-4 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-xs uppercase tracking-wide text-purple-400 font-semibold">gerador de podcast</div>
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 animate-pulse"></div>
          </div>
          <div className="text-white font-semibold text-xl mb-2">Podcast com IA</div>
          <div className="text-stone-300 text-sm leading-relaxed">
            Gere podcasts envolventes a partir de qualquer tema ou anotação. Perfeito para aprender em qualquer lugar.
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Digite um tema ou cole anotações..."
              className="w-full px-4 py-3 pr-16 rounded-xl bg-stone-900/70 border border-zinc-700 text-white placeholder-zinc-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-300"
              onKeyDown={(e) => e.key === "Enter" && onGenerate()}
            />
          </div>
          <button
            onClick={onGenerate}
            disabled={busy || !topic.trim()}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-[#fff] font-medium transition-all duration-300"
          >
            {busy ? "Gerando…" : "Gerar"}
          </button>
        </div>

        {status && (
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40 text-purple-200 font-medium">
            {status}
            <div className="text-xs mt-2 opacity-70">
              Arquivo de áudio: {audioFile ? 'Definido' : 'Não definido'} |
              Em execução: {busy ? 'Sim' : 'Não'}
            </div>
          </div>
        )}

        {audioFile && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-stone-900/70 border border-zinc-700">
              <div className="text-sm text-stone-400 mb-2">Prévia:</div>
              <audio
                controls
                className="w-full"
                src={audioFile}
              >
                Seu navegador não suporta o elemento de áudio.
              </audio>
            </div>

            <a
              href={audioFile}
              download={audioFilename || "podcast.mp3"}
              className="block p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-[#fff] font-medium text-center transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
            >
              Baixar podcast
            </a>
          </div>
        )}

        {!audioFile && !busy && (
          <div className="text-xs text-stone-500 text-center p-2">
            Clique em Gerar para criar um podcast
          </div>
        )}
      </div>
    </div>
  )
}