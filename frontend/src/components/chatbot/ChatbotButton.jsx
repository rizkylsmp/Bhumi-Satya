import { useEffect, useState } from "react";
import { ArrowUpIcon, ChatCircleIcon } from "@phosphor-icons/react";

const ChatbotButton = ({ onClick }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setShowScrollTop(window.scrollY > 320);

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const scrollToTop = () => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <>
      <button
        type="button"
        onClick={scrollToTop}
        tabIndex={showScrollTop ? 0 : -1}
        aria-hidden={!showScrollTop}
        aria-label="Kembali ke atas"
        title="Kembali ke atas"
        className={`group fixed bottom-[4.5rem] right-6 z-40 grid size-9 place-items-center rounded-xl border border-border bg-surface text-text-secondary shadow-md shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
          showScrollTop
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        <ArrowUpIcon size={17} weight="bold" />
        <span className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-text-primary opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
          Kembali ke atas
        </span>
      </button>

      <button
        type="button"
        onClick={onClick}
        className="group fixed bottom-5 right-5 z-40 grid size-11 place-items-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-black/15 transition duration-200 hover:-translate-y-0.5 hover:bg-gray-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600"
        title="Buka chatbot bantuan"
        aria-label="Buka chatbot bantuan"
      >
        <ChatCircleIcon size={23} weight="fill" />

        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-emerald-400">
          <span className="sr-only">Chatbot aktif</span>
        </span>

        <span className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-text-primary opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-visible:opacity-100">
          Butuh bantuan?
        </span>
      </button>
    </>
  );
};

export default ChatbotButton;
