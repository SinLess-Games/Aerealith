import type { AiModelSummary } from '@aerealith-ai/ai-client';
import type { TextMessage } from '@aerealith-ai/ai-orchestration';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import {
  FiArrowUp,
  FiMessageSquare,
  FiPlus,
  FiStopCircle,
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
    <div className="grid min-h-[34rem] overflow-hidden rounded-2xl border border-[var(--ae-border)] bg-[var(--ae-surface)] shadow-[var(--ae-shadow-sm)] lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-h-[34rem] flex-col">
        <div className="flex items-center gap-3 border-b border-[var(--ae-border)] px-4 py-3 sm:px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--ae-primary-subtle)] text-[var(--ae-primary)]">
            <FiMessageSquare aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-semibold">Chat</h2>
            <p className="text-xs text-[var(--ae-foreground-muted)]">
              {streamingEnabled
                ? 'Streaming responses enabled'
                : 'Durable response mode'}
            </p>
          </div>
          <button
            type="button"
            className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--ae-border)] px-3 text-sm font-semibold text-[var(--ae-foreground-muted)] transition-colors hover:bg-[var(--ae-surface-muted)] hover:text-[var(--ae-foreground)]"
            onClick={resetConversation}
          >
            <FiPlus aria-hidden="true" />
            New
          </button>
        </div>

        <div
          className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="flex min-h-[18rem] items-center justify-center">
              <div className="max-w-lg text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)] text-2xl text-[var(--ae-primary)]">
                  <FiMessageSquare aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">
                  What do you want to work on?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ae-foreground-muted)]">
                  Ask a question, plan a feature, reason through an
                  architecture decision, or start a longer AI conversation.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={[
                  'max-w-[88%] rounded-2xl border px-4 py-3 text-sm leading-relaxed sm:px-5 sm:py-4',
                  message.role === 'user'
                    ? 'ml-auto border-[var(--ae-primary)] bg-[var(--ae-primary-subtle)]'
                    : 'border-[var(--ae-border)] bg-[var(--ae-background-elevated)]',
                ].join(' ')}
              >
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ae-foreground-muted)]">
                  {message.role === 'user' ? 'You' : 'Aerealith'}
                </div>
                <div className="whitespace-pre-wrap">
                  {message.content ||
                    (isSending ? 'Thinking…' : '')}
                </div>
              </article>
            ))
          )}
        </div>

        <div className="border-t border-[var(--ae-border)] p-3 sm:p-4">
          {error ? (
            <div
              role="alert"
              className="mb-3 rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] px-3 py-2 text-sm text-[var(--ae-danger-foreground)]"
            >
              {error}
            </div>
          ) : null}

          <div className="rounded-xl border border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-2 focus-within:border-[var(--ae-primary)]">
            <textarea
              value={prompt}
              disabled={isSending}
              rows={3}
              placeholder="Message Aerealith…"
              aria-label="Message Aerealith"
              className="w-full resize-none border-0 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-[var(--ae-foreground-muted)]"
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
            <div className="flex items-center gap-2 px-1 pb-1">
              <span className="text-xs text-[var(--ae-foreground-muted)]">
                Enter to send · Shift+Enter for newline
              </span>
              {isSending ? (
                <button
                  type="button"
                  className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--ae-danger-border)] bg-[var(--ae-danger-subtle)] text-[var(--ae-danger)]"
                  aria-label="Stop generation"
                  onClick={() => abortRef.current?.abort()}
                >
                  <FiStopCircle aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!prompt.trim()}
                  className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ae-primary)] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send message"
                  onClick={() => void sendMessage()}
                >
                  <FiArrowUp aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="border-t border-[var(--ae-border)] bg-[var(--ae-background-elevated)] p-5 lg:border-l lg:border-t-0">
        <h3 className="text-sm font-semibold">Session</h3>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
              Persistence
            </dt>
            <dd className="mt-1 font-medium">
              {conversationId ? 'Saved conversation' : 'Starts on first send'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
              Response mode
            </dt>
            <dd className="mt-1 font-medium">
              {streamingEnabled ? 'Streaming' : 'Durable run'}
            </dd>
          </div>
        </dl>

        {modelSelectorEnabled ? (
          <label className="mt-6 block">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--ae-foreground-muted)]">
              Model
            </span>
            <select
              value={selectedModel}
              disabled={isSending}
              className="mt-2 min-h-11 w-full rounded-lg border border-[var(--ae-border)] bg-[var(--ae-surface)] px-3 text-sm"
              onChange={(event) => setSelectedModel(event.target.value)}
            >
              <option value="">Automatic routing</option>
              {textModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {shortModelName(model.id)}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="mt-6 rounded-lg border border-[var(--ae-border)] bg-[var(--ae-surface)] p-3 text-xs leading-relaxed text-[var(--ae-foreground-muted)]">
            Model selection is managed automatically by the AI router.
          </p>
        )}
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
