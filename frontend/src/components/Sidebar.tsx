import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getChats } from "../lib/api";
import Logo from "./Logo";
import ThemeToggle from "./theme/ThemeToggle";

interface Chat {
  id: string;
  title?: string;
}

interface ChatsResponse {
  chats: Chat[];
}

export default function Sidebar() {
  const p = useLocation().pathname
  const [isToggled, setIsToggled] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('pagelm:nav-collapsed')
      if (saved !== null) return saved === '1'
    } catch {
      /* storage unavailable */
    }
    return false
  })
  const [chats, setChats] = useState<ChatsResponse | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('pagelm:nav-collapsed', isCollapsed ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
    document.documentElement.classList.toggle('nav-collapsed', isCollapsed)
  }, [isCollapsed]);

  useEffect(() => {
    if (isToggled) {
      getChats().then(data => setChats(data));
    }
  }, [isToggled]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isToggled) setIsToggled(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isToggled]);

  const isChat = p === '/' || p === '/chat' || p.startsWith('/chat/');
  const isSources = p === '/sources' || p.startsWith('/sources/');
  const isStudio = p === '/studio' || p.startsWith('/studio/');

  const navItemClass = (active: boolean) =>
    `group flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2.5 py-1.5 transition-all duration-200 md:size-11 md:gap-0 md:px-0 md:py-0 ${
      active
        ? 'bg-sky-500/10 text-sky-500 ring-1 ring-inset ring-sky-500/30'
        : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100'
    }`;
  const actionClass = `flex size-10 items-center justify-center rounded-2xl text-stone-400 transition-all duration-200 hover:bg-stone-900 hover:text-stone-100 md:size-11`;

  const collapseNav = () => {
    setIsToggled(false);
    setIsCollapsed(true);
  };

  return (
    <>
      {isToggled && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsToggled(false)}
          aria-hidden="true"
        />
      )}

      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="fixed left-0 top-1/2 z-50 hidden h-16 w-8 -translate-y-1/2 items-center justify-center rounded-r-2xl border border-l-0 border-stone-800 bg-stone-950/95 text-stone-300 shadow-xl shadow-black/10 transition-colors hover:bg-stone-900 hover:text-white md:flex"
          title="Mostrar menu"
          aria-label="Mostrar menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </button>
      )}

      <aside
        className={`fixed inset-x-0 bottom-0 z-50 flex px-3 pb-3 pt-0 transition-transform duration-300 ease-out md:inset-y-0 md:right-auto md:w-fit md:p-4 ${
          isCollapsed ? 'md:-translate-x-full' : ''
        }`}
      >
        {/* Chat history: a sheet above the dock on mobile, a side panel on desktop. */}
        <div
          className={`fixed inset-x-3 bottom-24 z-40 max-h-[60vh] flex-col overflow-y-auto rounded-3xl border border-stone-900 bg-stone-950/95 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl custom-scroll md:static md:order-2 md:h-full md:max-h-none md:w-72 md:rounded-2xl md:border-l-transparent md:shadow-none ${
            isToggled ? 'flex' : 'hidden'
          }`}
        >
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-200">Histórico de conversas</span>
              {chats?.chats && (
                <span className="rounded-full border border-stone-800 bg-stone-900 px-1.5 py-0.5 text-[10px] text-stone-400">
                  {chats.chats.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsToggled(false)}
              className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-100"
              title="Fechar histórico (Esc)"
              aria-label="Fechar histórico de conversas"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
            {chats === null ? (
              <p className="py-6 text-center text-xs text-stone-500">Carregando…</p>
            ) : chats.chats.length ? (
              chats.chats.map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/?chatId=${chat.id}`}
                  onClick={() => setIsToggled(false)}
                  className="block truncate rounded-xl border border-transparent p-2.5 text-sm transition-colors hover:border-stone-800 hover:bg-stone-900/90 hover:text-stone-100"
                >
                  {chat.title || "Conversa sem título"}
                </Link>
              ))
            ) : (
              <p className="py-6 text-center text-xs text-stone-500">Nenhuma conversa anterior</p>
            )}
          </div>

          <div className="mt-3 border-t border-stone-800 pt-3">
            <Link
              to="/sources"
              onClick={() => setIsToggled(false)}
              className="flex items-center gap-2 text-xs text-stone-400 transition-colors hover:text-stone-200"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              Gerenciar fontes
            </Link>
          </div>
        </div>

        {/* Navigation rail (desktop) / bottom dock (mobile). */}
        <div
          id="nav-rail"
          className="flex w-full items-center justify-between gap-1 rounded-2xl border border-stone-900 bg-stone-950/90 px-1.5 py-1.5 shadow-xl shadow-black/10 backdrop-blur-xl md:order-1 md:h-full md:w-20 md:flex-col md:gap-3 md:rounded-3xl md:px-0 md:py-4"
        >
          <Link to="/" className="hidden md:flex" aria-label="PageLM">
            <Logo size={40} />
          </Link>

          <nav className="flex items-center gap-1 md:my-auto md:flex-col md:gap-2">
            <Link to='/sources' className={navItemClass(isSources)} title="Fontes" aria-label="Fontes">
              <svg className="size-6 md:size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              <span className="text-[10px] font-medium leading-none md:hidden">Fontes</span>
            </Link>

            <Link to='/' className={navItemClass(isChat)} title="Conversa" aria-label="Conversa">
              <svg className="size-6 md:size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3.75h6.75M21 12c0 4.556-4.03 8.25-9 8.25a9.76 9.76 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              <span className="text-[10px] font-medium leading-none md:hidden">Conversa</span>
            </Link>

            <Link to='/studio' className={navItemClass(isStudio)} title="Estúdio" aria-label="Estúdio">
              <svg className="size-6 md:size-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
              <span className="text-[10px] font-medium leading-none md:hidden">Estúdio</span>
            </Link>
          </nav>

          <div className="flex items-center gap-1 md:flex-col md:gap-2">
            <ThemeToggle className={actionClass} />

            <button
              type="button"
              onClick={collapseNav}
              className={`hidden md:inline-flex ${actionClass}`}
              aria-label="Ocultar menu"
              title="Ocultar menu"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setIsToggled(prev => !prev)}
              className={`${actionClass} ${isToggled ? 'bg-stone-900 text-white' : ''}`}
              aria-label="Histórico de conversas"
              title="Histórico de conversas"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
