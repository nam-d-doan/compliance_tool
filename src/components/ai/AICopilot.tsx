import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Send,
  X,
  RotateCcw,
  Lightbulb,
  MessageSquareWarning,
  Bot,
  User,
} from "lucide-react";
import { useCopilotStore, useAuthStore } from "@/stores";
import { useCopilotMessage } from "@/hooks/mutations/useAIMutations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { TypewriterText } from "./TypewriterText";
import { AIExplanation } from "./AIExplanation";
import { ConfidenceIndicator } from "./ConfidenceIndicator";
import type {
  AICopilotMessage,
  AIExplanation as AIExplanationType,
} from "@/types";

const MODEL_VERSION = "gpt-4o-mock-v1";

const SUGGESTED_PROMPTS = [
  {
    label: "Compliance status?",
    prompt: "What is our overall compliance status?",
  },
  {
    label: "Summarize open CAPs",
    prompt: "Summarize the open corrective action plans",
  },
  {
    label: "What needs my approval?",
    prompt: "What items need my approval?",
  },
  {
    label: "Show top risks",
    prompt: "What are the highest compliance risks this month?",
  },
];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFollowUpPrompt(
  action: NonNullable<AICopilotMessage["suggestedActions"]>[number],
): string | null {
  if (action.action === "prompt" && typeof action.params?.prompt === "string") {
    return action.params.prompt;
  }
  return null;
}

export function AICopilot() {
  const location = useLocation();
  const { role } = useAuthStore();
  const {
    isOpen,
    open: openPanel,
    close,
    toggle,
    thread,
    addMessage,
    clearThread,
    isGenerating,
    setGenerating,
    threadId,
  } = useCopilotStore();
  const copilotMessage = useCopilotMessage();

  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [activeExplanation, setActiveExplanation] = useState<
    AIExplanationType | undefined
  >(undefined);
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(
    () => new Set(thread.map((m) => m.id)),
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const route = location.pathname;

  const lastUserMessage = useMemo(
    () => thread.findLast((m) => m.role === "user"),
    [thread],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread, isGenerating, error]);

  useEffect(() => {
    if (isOpen) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (isTyping) return;
        event.preventDefault();
        toggle();
      }

      if (event.key === "Escape" && isOpen) {
        close();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, toggle, close]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isGenerating) return;

      setError(null);
      const nextThreadId = threadId ?? `thread-${crypto.randomUUID()}`;
      const userMessage: AICopilotMessage = {
        id: `msg-user-${crypto.randomUUID()}`,
        threadId: nextThreadId,
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
        mode: "system",
      };

      addMessage(userMessage);
      setInput("");
      setGenerating(true);

      try {
        const startTime = Date.now();
        const response = await copilotMessage.mutateAsync({
          message: userMessage.content,
          threadId: userMessage.threadId,
          mode: "system",
          context: { route, role },
        });
        const elapsed = Date.now() - startTime;
        if (elapsed < 800) {
          await delay(800 - elapsed);
        }
        addMessage(response);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      } finally {
        setGenerating(false);
      }
    },
    [
      addMessage,
      copilotMessage,
      isGenerating,
      route,
      role,
      setGenerating,
      threadId,
    ],
  );

  const handleRetry = useCallback(() => {
    if (lastUserMessage) {
      void sendMessage(lastUserMessage.content);
    }
  }, [lastUserMessage, sendMessage]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const handleClear = () => {
    clearThread();
    setSeenMessageIds(new Set());
    setError(null);
  };

  const openExplanation = (message: AICopilotMessage) => {
    if (!message.explanation) return;
    setActiveExplanation(message.explanation);
    setExplanationOpen(true);
  };

  const isThreadEmpty = thread.length === 0;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed right-4 bottom-20 z-40 flex h-[min(70vh,32rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[18px] border bg-card shadow-[var(--card-shadow)] backdrop-blur-2xl sm:right-6 sm:bottom-24 sm:w-[380px] [border-color:var(--card-border)]"
          >
            <div className="flex shrink-0 items-center gap-2 border-b px-4 py-3.5">
              <Sparkles
                className="text-chart-accent size-4"
                aria-hidden="true"
              />
              <span className="font-heading text-sm font-bold">AI Copilot</span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={close}
                className="ml-auto"
                aria-label="Close AI Copilot"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-3.5 p-4">
                {isThreadEmpty && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-muted-foreground">
                      Ask me about any obligation, CAP, or regulation.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTED_PROMPTS.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => void sendMessage(item.prompt)}
                          disabled={isGenerating}
                          className="rounded-full border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50 [border-color:var(--card-border)]"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {thread.map((message, index) => {
                  const isUser = message.role === "user";
                  const followups =
                    message.suggestedActions?.filter(
                      (a) => a.action === "prompt",
                    ) ?? [];

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: index < 2 ? index * 0.05 : 0,
                      }}
                      className={cn(
                        "flex",
                        isUser ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] space-y-1.5 rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed",
                          isUser
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "bg-chip rounded-bl-sm",
                        )}
                      >
                        <div>
                          {isUser || seenMessageIds.has(message.id) ? (
                            <span>{message.content}</span>
                          ) : (
                            <TypewriterText
                              text={message.content}
                              speed={15}
                              onDone={() =>
                                setSeenMessageIds(
                                  (prev) => new Set([...prev, message.id]),
                                )
                              }
                            />
                          )}
                        </div>

                        {!isUser && message.explanation && (
                          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-1.5">
                            <ConfidenceIndicator
                              confidence={message.explanation.confidence}
                              size="sm"
                            />
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => openExplanation(message)}
                              className="gap-1"
                            >
                              <Lightbulb
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              Why?
                            </Button>
                          </div>
                        )}

                        {!isUser && followups.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {followups.map((action, actionIndex) => {
                              const prompt = getFollowUpPrompt(action);
                              return (
                                <button
                                  key={actionIndex}
                                  onClick={() =>
                                    prompt && void sendMessage(prompt)
                                  }
                                  disabled={isGenerating}
                                  className="inline-flex items-center rounded-full bg-background/60 px-2 py-0.5 text-[11px] transition-colors hover:bg-background disabled:opacity-50"
                                >
                                  {action.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-chip px-3.5 py-2.5"
                  >
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                    <span className="sr-only">AI is thinking</span>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
                  >
                    <MessageSquareWarning
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p>{error}</p>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={handleRetry}
                        className="mt-1 gap-1 text-destructive hover:bg-destructive/10"
                      >
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                        Retry
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="shrink-0 border-t p-3">
              <div className="flex items-center gap-2 rounded-full border bg-chip px-1.5 py-1 [border-color:var(--card-border)]">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about any obligation, CAP, or regulation…"
                  disabled={isGenerating}
                  rows={1}
                  className="max-h-24 min-h-8 flex-1 resize-none border-none bg-transparent px-2.5 py-1 text-xs shadow-none focus-visible:ring-0"
                  aria-label="AI Copilot message"
                />
                <button
                  type="button"
                  onClick={() => void sendMessage(input)}
                  disabled={!input.trim() || isGenerating}
                  aria-label="Send message"
                  className="bg-chart-accent flex size-8 shrink-0 items-center justify-center rounded-full text-[#1a1a16] disabled:opacity-40"
                >
                  <Send className="size-3.5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-muted-foreground">
                <button
                  onClick={handleClear}
                  disabled={isThreadEmpty || isGenerating}
                  className="flex items-center gap-1 hover:text-foreground disabled:opacity-50"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Clear
                </button>
                <span>{MODEL_VERSION}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeExplanation && (
        <AIExplanation
          explanation={activeExplanation}
          open={explanationOpen}
          onOpenChange={setExplanationOpen}
        />
      )}

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openPanel}
            className="bg-ink-chip border-chart-accent fixed right-4 bottom-4 z-40 flex size-[54px] items-center justify-center rounded-full border-2 shadow-lg transition-shadow sm:right-6 sm:bottom-6"
            aria-label="Open AI Copilot"
          >
            <Sparkles
              className="text-chart-accent relative size-5"
              aria-hidden="true"
            />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
