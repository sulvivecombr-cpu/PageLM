import { useTheme } from "./theme-context";

type Props = {
  /** Extra classes, so the control can sit in the rail, the dock or a header. */
  className?: string;
  /** Visual size of the icon. */
  size?: "sm" | "md";
};

/**
 * Single control that flips the app between light and dark.
 * The icon shows the theme the click will switch *to*.
 */
export default function ThemeToggle({ className = "", size = "md" }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const iconClass = size === "sm" ? "size-4" : "size-5";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={className}
      aria-label={isDark ? "Mudar para o tema claro" : "Mudar para o tema escuro"}
      aria-pressed={isDark}
      title={isDark ? "Tema claro" : "Tema escuro"}
    >
      <span className="theme-toggle-icon flex items-center justify-center">
        {isDark ? (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
          </svg>
        )}
      </span>
    </button>
  );
}
