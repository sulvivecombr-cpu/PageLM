export const AI_LANGUAGES = ["Português", "Inglês", "Espanhol", "Francês"] as const;
export type AiLanguage = (typeof AI_LANGUAGES)[number];

export const DEFAULT_AI_LANGUAGE: AiLanguage = "Português";

export function getAiLanguage(): AiLanguage {
  try {
    const saved = localStorage.getItem("pagelm:ai-language");
    if (saved && (AI_LANGUAGES as readonly string[]).includes(saved)) return saved as AiLanguage;
  } catch { }
  return DEFAULT_AI_LANGUAGE;
}

export function setAiLanguage(language: AiLanguage) {
  try { localStorage.setItem("pagelm:ai-language", language); } catch { }
}
