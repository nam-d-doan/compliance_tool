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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
    label: "What's our compliance status?",
    prompt: "What is our overall compliance status?",
  },
  {
    label: "Which regulations are effective soon?",
    prompt: "Which regulations are becoming effective soon?",
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
  {
    label: "Prioritize my week",
    prompt: "What should I prioritize this week?",
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
      <Sheet
        open={isOpen}
        onOpenChange={(open) => (open ? openPanel() : close())}
      >
        <SheetContent
          side="right"
          className="w-full p-0 sm:w-[420px]"
          showCloseButton={false}
        >
          <div className="flex h-full flex-col">
            <div
              className="flex shrink-0 items-start justify-between p-4 text-white"
              style={{ background: "linear-gradient(135deg,#102f57,#1c5894)" }}
            >
              <div className="min-w-0 flex-1">
                <SheetHeader className="space-y-1 p-0">
                  <SheetTitle className="flex items-center gap-2 text-base font-semibold text-white">
                    <Sparkles className="size-5" aria-hidden="true" />
                    AI Copilot
                  </SheetTitle>
                  <SheetDescription className="text-xs text-blue-100/90">
                    Ask me anything about compliance, regulations, or your
                    tasks.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                    {MODEL_VERSION}
                  </span>
                  <span className="text-[10px] text-blue-100/80">
                    Explainable AI
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={close}
                className="shrink-0 text-white hover:bg-white/10"
                aria-label="Close AI Copilot"
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-4 p-4">
                {isThreadEmpty && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Bot className="size-4" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          How can I help?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Choose a suggested prompt or type your own question.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      {SUGGESTED_PROMPTS.map((item, index) => (
                        <motion.button
                          key={item.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => void sendMessage(item.prompt)}
                          disabled={isGenerating}
                          className="flex items-center gap-2 rounded-lg border border-border bg-card p-3 text-left text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50"
                        >
                          <Lightbulb
                            className="size-4 shrink-0 text-primary"
                            aria-hidden="true"
                          />
                          <span className="line-clamp-2">{item.label}</span>
                        </motion.button>
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
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: index < 2 ? index * 0.05 : 0,
                      }}
                      className={cn(
                        "flex gap-3",
                        isUser ? "justify-end" : "justify-start",
                      )}
                    >
                      {!isUser && (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Bot className="size-4" aria-hidden="true" />
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[85%] space-y-2 rounded-2xl px-4 py-3",
                          isUser
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm border border-border bg-card",
                        )}
                      >
                        <div className="text-sm leading-relaxed">
                          {isUser || seenMessageIds.has(message.id) ? (
                            <span
                              className={cn(
                                isUser
                                  ? "text-primary-foreground"
                                  : "text-foreground",
                              )}
                            >
                              {message.content}
                            </span>
                          ) : (
                            <TypewriterText
                              text={message.content}
                              speed={15}
                              className={cn("text-foreground")}
                              onDone={() =>
                                setSeenMessageIds(
                                  (prev) => new Set([...prev, message.id]),
                                )
                              }
                            />
                          )}
                        </div>

                        {!isUser && message.explanation && (
                          <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2">
                            <ConfidenceIndicator
                              confidence={message.explanation.confidence}
                              size="sm"
                              showLabel
                            />
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => openExplanation(message)}
                              className="gap-1 text-primary"
                            >
                              <Lightbulb
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              View reasoning
                            </Button>
                          </div>
                        )}

                        {!isUser && followups.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {followups.map((action, actionIndex) => {
                              const prompt = getFollowUpPrompt(action);
                              return (
                                <button
                                  key={actionIndex}
                                  onClick={() =>
                                    prompt && void sendMessage(prompt)
                                  }
                                  disabled={isGenerating}
                                  className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                                >
                                  {action.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <p
                          className={cn(
                            "text-[10px]",
                            isUser
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground",
                          )}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {isUser && (
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <User className="size-4" aria-hidden="true" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {isGenerating && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="size-4" aria-hidden="true" />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3">
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.3s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70 [animation-delay:-0.15s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/70" />
                      <span className="sr-only">AI is thinking</span>
                    </div>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-destructive"
                  >
                    <MessageSquareWarning
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{error}</p>
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

            <div className="shrink-0 border-t bg-card p-4">
              <div className="flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask the AI Copilot..."
                  disabled={isGenerating}
                  rows={1}
                  className="min-h-[44px] max-h-[120px] resize-none rounded-xl border-border bg-muted/50 py-3 pr-4 focus-visible:bg-background"
                  aria-label="AI Copilot message"
                />
                <Button
                  size="icon"
                  onClick={() => void sendMessage(input)}
                  disabled={!input.trim() || isGenerating}
                  aria-label="Send message"
                >
                  <Send className="size-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <button
                  onClick={handleClear}
                  disabled={isThreadEmpty || isGenerating}
                  className="flex items-center gap-1 hover:text-foreground disabled:opacity-50"
                >
                  <RotateCcw className="size-3" aria-hidden="true" />
                  Clear conversation
                </button>
                <span>Powered by {MODEL_VERSION} · Explainable AI</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
            className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20 transition-shadow hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 sm:right-6 sm:bottom-6"
            aria-label="Open AI Copilot"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30 opacity-75" />
            <Sparkles className="relative size-6" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
