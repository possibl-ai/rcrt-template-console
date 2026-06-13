import { useMemo } from 'react';
import type { RcrtClient } from '@possibl/rcrt-sdk';
import { Chat, type ChatConfig, type RcrtClientLike } from '@possibl/rcrt-ui/chat';
import type { AdvisorChatProps } from '@possibl/rcrt-app-kit/shell';

// The advisor surface: @possibl/rcrt-ui's <Chat> rendered through the kit's
// `advisor.renderChat` seam, so the advisor speaks rich JIT-UI cards (guides,
// metrics) instead of plain text. The kit hands us a tenant-bound SDK client +
// the location grounding tags; we adapt the SDK's modular surface
// (client.chat.*) to the chat widget's flat RcrtClientLike and attach the
// grounding tags to every send. This file is the ONLY coupling between the SDK
// and the chat widget — app.config.tsx just references <AdvisorChat />.

const CHAT_CONFIG: ChatConfig = {
  agent: 'advisor',
  allow_agent_switch: false,
  show_streaming_text: true,
  show_tool_calls: true,
  show_thinking: true,
  show_artifacts: true,
  create_session: true,
  layout: 'compact',
  input_placeholder: 'Ask your advisor anything…',
};

function toClientLike(
  client: RcrtClient,
  agent: string,
  groundingTags: () => string[],
): RcrtClientLike {
  return {
    async sendChat(message, sessionId, extraTags, targetAgent) {
      const req: Parameters<typeof client.chat.send>[0] = {
        message,
        target_agent: targetAgent || agent,
      };
      if (sessionId) req.session_id = sessionId;
      const tags = [...(extraTags || []), ...groundingTags()];
      if (tags.length) req.extra_tags = tags;
      const res = await client.chat.send(req);
      return { id: res.id, session_id: res.session_id };
    },
    async getSessionBreadcrumbs(sessionId, limit) {
      const rows = await client.chat.sessionBreadcrumbs(sessionId, limit ?? 100);
      return rows as unknown as Array<Record<string, unknown>>;
    },
    connectSessionStream(sessionId, handlers) {
      const conn = client.chat.sessionStream(sessionId, {
        onConnected: () => handlers.onConnected?.({ participants: [] }),
        onDelta: (d) => handlers.onDelta?.({ agent_id: d.agent_id, delta: d.delta, is_final: d.is_final }),
        onMessage: (bc) => handlers.onMessage?.(bc as unknown),
        onThought: (t) => handlers.onThought?.(t as unknown),
        onAction: (a) => handlers.onAction?.(a as unknown),
        onError: (err, isFatal) => handlers.onError?.(err as unknown as Event, isFatal),
      });
      return () => conn.close();
    },
    async createBreadcrumb(data) {
      const bc = await client.breadcrumbs.create(
        data as unknown as Parameters<typeof client.breadcrumbs.create>[0],
      );
      return { id: bc.id };
    },
    async uploadFile(file, scope) {
      const bc = await client.files.upload(
        file,
        scope ? { scope: scope as 'tenant' | 'org' | 'user' } : {},
      );
      return { id: bc.id, title: bc.title };
    },
    async getChattableAgents() {
      const agents = await client.chat.listAgents();
      return agents.map((a) => ({ id: a.id, name: a.name }));
    },
  };
}

export function AdvisorChat({ client, agent, sessionId, onSessionCreated, prefillText, groundingTags }: AdvisorChatProps) {
  const like = useMemo(
    () => toClientLike(client, agent, groundingTags),
    [client, agent, groundingTags],
  );
  return (
    <Chat
      client={like}
      config={CHAT_CONFIG}
      sessionId={sessionId}
      onSessionCreated={onSessionCreated}
      prefillText={prefillText}
      className="h-full"
    />
  );
}
