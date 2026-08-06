import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChatCircleIcon,
  PaperPlaneRightIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { chatbotService } from "../../services/api";

const SESSION_KEY = "bhumi_satya_chatbot_session";
const FALLBACK_SUGGESTIONS = [
  "Apa itu Bhumi Satya?",
  "Cara menggunakan peta?",
  "Bagaimana melihat data 3D?",
];

const createSessionId = () => {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const id =
    globalThis.crypto?.randomUUID?.() ||
    `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(SESSION_KEY, id);
  return id;
};

const welcomeMessage = {
  id: "welcome",
  role: "bot",
  text: "Halo! Saya asisten Bhumi Satya. Tanyakan seputar aset, peta, akun, atau data 2D dan 3D.",
};

const ChatbotModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);
  const [quickReplies, setQuickReplies] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const sessionIdRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    sessionIdRef.current = createSessionId();
    let active = true;

    const loadChat = async () => {
      const [suggestionsResult, historyResult] = await Promise.allSettled([
        chatbotService.getSuggestions(),
        chatbotService.getHistory(sessionIdRef.current),
      ]);

      if (!active) return;

      if (suggestionsResult.status === "fulfilled") {
        setSuggestions(
          suggestionsResult.value.data?.data?.slice(0, 4) ||
            FALLBACK_SUGGESTIONS,
        );
      }

      if (historyResult.status === "fulfilled") {
        const history = historyResult.value.data?.data || [];
        if (history.length) {
          setMessages([
            welcomeMessage,
            ...history.flatMap((item) => [
              {
                id: `user-${item.id_chat}`,
                role: "user",
                text: item.pesan,
              },
              {
                id: `bot-${item.id_chat}`,
                role: "bot",
                text: item.jawaban,
              },
            ]),
          ]);
        }
      }
    };

    loadChat();
    inputRef.current?.focus();

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      active = false;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (messageText) => {
    const text = messageText.trim();
    if (!text || isLoading) return;

    const pendingId = `pending-${Date.now()}`;
    setInput("");
    setError("");
    setQuickReplies([]);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text },
    ]);
    setIsLoading(true);

    try {
      const response = await chatbotService.sendMessage({
        pesan: text,
        session_id: sessionIdRef.current || createSessionId(),
      });
      const result = response.data?.data;

      setMessages((current) => [
        ...current,
        {
          id: result?.id_chat || pendingId,
          role: "bot",
          text: result?.jawaban || "Maaf, jawaban belum tersedia.",
        },
      ]);
      setQuickReplies(result?.quickReplies?.slice(0, 3) || []);
    } catch {
      setError("Chatbot belum dapat terhubung. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  const handleClear = async () => {
    setMessages([welcomeMessage]);
    setQuickReplies([]);
    setError("");

    try {
      await chatbotService.clearHistory(
        sessionIdRef.current || createSessionId(),
      );
    } catch {
      setError("Riwayat di layar sudah dibersihkan, tetapi gagal disinkronkan.");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <section
      role="dialog"
      aria-modal="false"
      aria-label="Asisten Bhumi Satya"
      className="motion-panel-enter fixed inset-x-3 bottom-20 z-50 ml-auto flex h-[min(31rem,calc(100dvh-6.5rem))] w-auto flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[22rem]"
    >
      <header className="flex min-h-14 items-center justify-between border-b border-white/10 bg-gray-900 px-3.5 py-2.5 text-white dark:bg-gray-700">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative grid size-8 shrink-0 place-items-center rounded-xl bg-white/15">
            <ChatCircleIcon size={19} weight="fill" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-gray-900 bg-emerald-400 dark:border-gray-700" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">Asisten Bhumi Satya</h2>
            <p className="text-[11px] text-gray-300">Aktif - bantuan cepat</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg p-2 text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            title="Bersihkan percakapan"
            aria-label="Bersihkan percakapan"
          >
            <TrashIcon size={17} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            title="Tutup chatbot"
            aria-label="Tutup chatbot"
          >
            <XIcon size={18} weight="bold" />
          </button>
        </div>
      </header>

      <div
        className="flex-1 space-y-2.5 overflow-y-auto bg-surface-secondary/60 px-3 py-3"
        aria-live="polite"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[84%] whitespace-pre-line rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                message.role === "user"
                  ? "rounded-br-md bg-gray-900 text-white dark:bg-gray-700 dark:text-gray-50"
                  : "rounded-bl-md border border-border bg-surface text-text-primary shadow-xs"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-surface px-3 py-2.5">
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  className="size-1.5 animate-pulse rounded-full bg-text-muted"
                  style={{ animationDelay: `${dot * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <footer className="border-t border-border bg-surface px-3 pb-3 pt-2.5">
        {error && (
          <p className="mb-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {(quickReplies.length ? quickReplies : suggestions).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => sendMessage(item)}
              disabled={isLoading}
              className="shrink-0 rounded-full border border-border bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-text-secondary transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent disabled:opacity-50"
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <label htmlFor="chatbot-message" className="sr-only">
            Tulis pertanyaan
          </label>
          <input
            ref={inputRef}
            id="chatbot-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={500}
            autoComplete="off"
            placeholder="Tulis pertanyaan..."
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface-secondary px-3 py-2 text-xs text-text-primary outline-none transition placeholder:text-text-muted focus:border-accent focus:ring-2 focus:ring-accent/15"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-gray-900 text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/50 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-700 dark:text-gray-50 dark:hover:bg-gray-600"
            aria-label="Kirim pesan"
          >
            <PaperPlaneRightIcon size={17} weight="fill" />
          </button>
        </form>
      </footer>
    </section>,
    document.body,
  );
};

export default ChatbotModal;
