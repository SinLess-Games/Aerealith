import type { AiModelSummary } from '@aerealith-ai/ai-client';
import type { TextMessage } from '@aerealith-ai/ai-orchestration';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import {
  FiArrowUp,
  FiCpu,
  FiMessageSquare,
  FiPlus,
  FiShield,
  FiStopCircle,
  FiZap,
} from 'react-icons/fi';

import {
  aiApi,
  consumeAiTextStream,
  modelsForCapability,
  runOutputText,
  waitForAiRun,
} from './ai-client';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const STARTER_PROMPTS = [
  {
    label: 'Plan a feature',
    prompt: 'Help me turn a product idea into a concrete implementation plan.',
  },
  {
    label: 'Review architecture',
    prompt: 'Review an architecture decision with me and surface tradeoffs, risks, and next steps.',
  },
  {
    label: 'Debug something',
    prompt: 'Help me diagnose a technical problem. Start by organizing the likely causes and the fastest checks.',
  },
  {
    label: 'Research deeply',
    prompt: 'Help me research a topic thoroughly and turn the findings into an actionable summary.',
  },
] as const;

export function AiChatPanel({
  models,
  modelSelectorEnabled,
  streamingEnabled,
}: {
  models: readonly AiModelSummary[];
  modelSelectorEnabled: boolean;
  streamingEnabled: boolean;
}) {
  const queryClient = useQueryClient();
  const textModels = useMemo(
    () => modelsForCapability(models, 'text'),
    [models],
  );
  const [selectedModel, setSelectedModel] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string>();
  const abortRef = useRef<AbortController | undefined>(undefined);

  async function sendMessage() {
    const content = prompt.trim();
    if (!content || isSending) return;

    setError(undefined);
    setIsSending(true);
    setPrompt('');

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let activeConversationId = conversationId;

      if (!activeConversationId) {
        const conversation = await aiApi.createConversation(
          titleFromMessage(content),
        );
        activeConversationId = conversation.id;
        setConversationId(conversation.id);
      }

      await aiApi.appendConversationMessage(
        activeConversationId,
        {
          role: 'user',
          content,
        },
      );

      const request = {
        capability: 'text' as const,
        input: {
          messages: nextMessages.map(
            (message): TextMessage => ({
              role: message.role,
              content: message.content,
            }),
          ),
        },
        ...(selectedModel
          ? {
              preferences: {
                model: selectedModel,
              },
            }
          : {}),
        metadata: {
          conversationId: activeConversationId,
        },
      };

      if (streamingEnabled) {
        const assistantId = crypto.randomUUID();
        setMessages((current) => [
          ...current,
          {
            id: assistantId,
            role: 'assistant',
            content: '',
          },
        ]);

        const result = await aiApi.streamText(
          request,
          controller.signal,
        );

        await consumeAiTextStream(result.stream, (delta) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: message.content + delta,
                  }
                : message,
            ),
          );
        });
      } else {
        const accepted = await aiApi.createRun(request, {
          idempotencyKey: crypto.randomUUID(),
          signal: controller.signal,
        });
        const completed = await waitForAiRun(accepted, {
          signal: controller.signal,
        });
        const response =
          runOutputText(completed) ??
          (completed.status === 'failed'
            ? 'The AI run failed before returning text.'
            : 'The AI run completed without a text response.');

        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: response,
          },
        ]);
      }

      await queryClient.invalidateQueries({
        queryKey: ['ai'],
      });
    } catch (caught) {
      if (
        caught instanceof DOMException &&
        caught.name === 'AbortError'
      ) {
        setError('Generation stopped.');
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : 'The AI request failed.',
        );
      }
    } finally {
      setIsSending(false);
      abortRef.current = undefined;
    }
  }

  function resetConversation() {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(undefined);
    setPrompt('');
    setError(undefined);
  }

  return (
    <div className="grid min-h-[42rem] overflow-hidden rounded-[28px] border border-[var(--ae-border)] bg-[var(--ae-glass-panel)] shadow-[var(--ae-shadow-lg)] lg:grid-cols-[minmax(0,1fr)_290px]">
      <div className="relative flex min-h-[42rem] min-w-0 flex-col">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-52 w-3/4 -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,var(--ae-primary-subtle),transparent_68%)]"
        />

        <div className="relative flex items-center gap-3 border-b border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/70 px-4 py-3.5 backdrop-blur-xl sm:px-5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ae-primary)]/40 bg-[var(--ae-primary-subtle)] text-[var(--ae-primary)] shadow-[var(--ae-shadow-sm)]">
            <FiMessageSquare aria-hidden="true" />
            <span
              aria-hidden="true"
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--ae-background-elevated)] bg-emerald-400"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">Chat</h2>
              <span className="rounded-full border border-[var(--ae-border)] bg-[var(--ae-surface-muted)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
                {streamingEnabled ? 'Live' : 'Durable'}
              </span>
            </div>
            <p className="truncate text-xs text-[var(--ae-foreground-muted)]">
              {selectedModel
                ? shortModelName(selectedModel)
                : 'Aerealith automatic routing'}
            </p>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface)] px-3 text-sm font-semibold text-[var(--ae-foreground-muted)] shadow-[var(--ae-shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--ae-primary)]/40 hover:text-[var(--ae-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]"
            onClick={resetConversation}
          >
            <FiPlus aria-hidden="true" />
            New
          </button>
        </div>

        <div
          className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="mx-auto flex min-h-[25rem] max-w-3xl flex-col items-center justify-center">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-3xl bg-[var(--ae-primary-subtle)] blur-xl"
                />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--ae-primary)]/50 bg-[var(--ae-background-elevated)] text-3xl text-[var(--ae-primary)] shadow-[var(--ae-shadow-lg)]">
                  <FiCpu aria-hidden="true" />
                </div>
              </div>
              <div className="mt-6 text-center">
                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--ae-primary)]">
                  Your AI workspace
                </div>
                <h3 className="mt-2 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">
                  What are we building today?
                </h3>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--ae-foreground-muted)]">
                  Ask naturally. Aerealith can reason through architecture,
                  code, research, planning, and longer multi-step work while
                  keeping the run auditable.
                </p>
              </div>

              <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
                {STARTER_PROMPTS.map((starter) => (
                  <button
                    key={starter.label}
                    type="button"
                    className="group flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/75 px-4 py-3 text-left text-sm font-semibold text-[var(--ae-foreground)] shadow-[var(--ae-shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--ae-primary)]/50 hover:bg-[var(--ae-primary-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ae-focus-ring)]"
                    onClick={() => setPrompt(starter.prompt)}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--ae-surface-muted)] text-[var(--ae-primary)] transition-colors group-hover:bg-[var(--ae-background-elevated)]">
                      <FiZap aria-hidden="true" />
                    </span>
                    {starter.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-4xl space-y-6">
              {messages.map((message) => {
                const userMessage = message.role === 'user';
                return (
                  <article
                    key={message.id}
                    className={[
                      'flex items-start gap-3',
                      userMessage ? 'justify-end' : 'justify-start',
                    ].join(' ')}
                  >
                    {!userMessage ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--ae-primary)]/40 bg-[var(--ae-primary-subtle)] text-sm text-[var(--ae-primary)]">
                        <FiCpu aria-hidden="true" />
                      </div>
                    ) : null}
                    <div
                      className={[
                        'max-w-[86%] rounded-2xl border px-4 py-3 text-sm leading-7 shadow-[var(--ae-shadow-sm)] sm:max-w-[78%] sm:px-5 sm:py-4',
                        userMessage
                          ? 'rounded-tr-md border-[var(--ae-primary)]/40 bg-[var(--ae-primary-subtle)]'
                          : 'rounded-tl-md border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/90',
                      ].join(' ')}
                    >
                      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ae-foreground-muted)]">
                        {userMessage ? 'You' : 'Aerealith'}
                      </div>
                      <div className="whitespace-pre-wrap">
                        {message.content ||
                          (isSending ? 'Thinking…' : '')}
                      </div>
                    </div>
                    {userMessage ? (
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface-muted)] text-xs font-bold text-[var(--ae-foreground-muted)]">
                        You
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative border-t border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/80 p-3 backdrop-blur-xl sm:p-4">
          {error ? (
            <div
              role="alert"
              className="mx-auto mb-3 max-w-4xl rounded-xl border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] px-3 py-2 text-sm text-[var(--ae-danger-foreground)]"
            >
              {error}
            </div>
          ) : null}

          <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-2 shadow-[var(--ae-shadow-md)] transition-colors focus-within:border-[var(--ae-primary)]">
            <textarea
              value={prompt}
              disabled={isSending}
              rows={3}
              placeholder="Message Aerealith…"
              aria-label="Message Aerealith"
              className="max-h-48 min-h-[72px] w-full resize-none border-0 bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-[var(--ae-foreground-muted)]"
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
            />
            <div className="flex items-center gap-2 border-t border-[var(--ae-divider)] px-2 pt-2">
              <div className="flex min-w-0 items-center gap-2 text-[11px] text-[var(--ae-foreground-muted)]">
                <FiShield aria-hidden="true" className="shrink-0 text-[var(--ae-accent)]" />
                <span className="hidden sm:inline">
                  Enter to send · Shift+Enter for newline
                </span>
                <span className="sm:hidden">Enter to send</span>
              </div>
              {isSending ? (
                <button
                  type="button"
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] px-3 text-sm font-semibold text-[var(--ae-danger)]"
                  aria-label="Stop generation"
                  onClick={() => abortRef.current?.abort()}
                >
                  <FiStopCircle aria-hidden="true" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!prompt.trim()}
                  className="ml-auto inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--ae-primary)] px-3.5 text-sm font-semibold text-white shadow-[var(--ae-shadow-sm)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  aria-label="Send message"
                  onClick={() => void sendMessage()}
                >
                  <span className="hidden sm:inline">Send</span>
                  <FiArrowUp aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <p className="mx-auto mt-2 max-w-4xl text-center text-[10px] leading-4 text-[var(--ae-foreground-muted)]">
            Aerealith can make mistakes. Review important output before acting
            on it.
          </p>
        </div>
      </div>

      <aside className="border-t border-[var(--ae-border)] bg-[var(--ae-background-elevated)]/80 p-5 lg:border-l lg:border-t-0">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--ae-border)] bg-[var(--ae-surface-muted)] text-[var(--ae-accent)]">
            <FiCpu aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Session context</h3>
            <p className="text-[11px] text-[var(--ae-foreground-muted)]">
              Runtime controls and routing
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ae-foreground-muted)]">
              Persistence
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
              <span
                aria-hidden="true"
                className={[
                  'h-2 w-2 rounded-full',
                  conversationId ? 'bg-emerald-400' : 'bg-[var(--ae-foreground-muted)]',
                ].join(' ')}
              />
              {conversationId ? 'Saved conversation' : 'Starts on first send'}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ae-foreground-muted)]">
              Response mode
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold">
              <FiZap aria-hidden="true" className="text-[var(--ae-primary)]" />
              {streamingEnabled ? 'Streaming' : 'Durable run'}
            </div>
          </div>
        </div>

        {modelSelectorEnabled ? (
          <label className="mt-5 block rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ae-foreground-muted)]">
              Model
            </span>
            <select
              value={selectedModel}
              disabled={isSending}
              className="mt-2 min-h-11 w-full rounded-xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] px-3 text-sm outline-none focus:border-[var(--ae-primary)]"
              onChange={(event) => setSelectedModel(event.target.value)}
            >
              <option value="">Automatic routing</option>
              {textModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {shortModelName(model.id)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[11px] leading-4 text-[var(--ae-foreground-muted)]">
              Automatic routing lets Aerealith pick the best available text
              model for the task.
            </p>
          </label>
        ) : (
          <div className="mt-5 rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FiShield aria-hidden="true" className="text-[var(--ae-accent)]" />
              Automatic model routing
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--ae-foreground-muted)]">
              Model selection is managed automatically by the AI router.
            </p>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-primary-subtle)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FiZap aria-hidden="true" className="text-[var(--ae-primary)]" />
            Built for longer work
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--ae-foreground-muted)]">
            Conversations persist after the first message so future turns can
            keep their context and run history.
          </p>
        </div>
      </aside>
    </div>
  );
}

function titleFromMessage(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > 64
    ? `${compact.slice(0, 61)}…`
    : compact;
}

function shortModelName(value: string): string {
  return value.split('/').at(-1) ?? value;
}

export default AiChatPanel;
