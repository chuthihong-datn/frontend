"use client";

import { useState, useRef, useEffect } from "react";

export default function ChatWidget() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!open) return;

      const target = event.target as Node;

      if (widgetRef.current && !widgetRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const sendMessage = async () => {
    if (!input || isThinking) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
        }),
      });

      const data = await res.json();
      const reply = data.reply || data.content;

      if (res.ok && reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: reply },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.message || "Xin lỗi, AI đang bận 😢",
          },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Xin lỗi, có lỗi xảy ra 😢" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div ref={widgetRef}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-orange-500/95 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] transition-transform duration-200 hover:scale-105 hover:bg-orange-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          aria-label="Mở chatbot hỗ trợ"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 21a8.5 8.5 0 1 0-7.4-4.3L4 20l3.3-.6A8.4 8.4 0 0 0 12 21Z" />
            <path d="M8.5 11.5h7" />
            <path d="M8.5 8.5h5" />
          </svg>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 flex h-[390px] w-[300px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/72 shadow-[0_18px_48px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/30 bg-gradient-to-r from-orange-500/95 to-amber-500/90 px-3 py-2.5 text-sm font-medium text-white shadow-sm">
            <span className="flex items-center gap-2">
              Hỗ trợ khách hàng
            </span>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Đóng chatbot"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-2 overflow-y-auto bg-white/22 p-2.5">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-2.5 py-1.5 rounded-xl max-w-[75%] text-[13px] ${
                    m.role === "user"
                      ? "bg-orange-500/95 text-white shadow-sm"
                      : "border border-white/70 bg-white/90 text-slate-700 shadow-sm backdrop-blur"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-1.5 border-t border-white/40 bg-white/58 p-2 backdrop-blur">
            <input
              className="flex-1 rounded-lg border border-white/60 bg-white/78 px-2.5 py-1.5 text-[13px] outline-none placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập tin nhắn..."
              disabled={isThinking}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              disabled={isThinking}
              className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-3 text-[13px] text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Gửi tin nhắn"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 2 11 13" />
                <path d="M22 2 15 22 11 13 2 9 22 2Z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}