// Google AI Studio (Gemini) chat endpoint.
// Emits OpenAI-style SSE chunks so the existing admin chat UI works unchanged.
import { createFileRoute } from '@tanstack/react-router';

const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const TEXT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'gemini-2.5-flash-image';

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

interface IncomingMessage {
  role: 'system' | 'user' | 'assistant';
  content:
    | string
    | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

function toParts(content: IncomingMessage['content']): Part[] {
  if (typeof content === 'string') return [{ text: content }];
  const parts: Part[] = [];
  for (const c of content) {
    if (c.type === 'text') parts.push({ text: c.text });
    else if (c.type === 'image_url') {
      const url = c.image_url.url;
      const m = /^data:([^;]+);base64,(.*)$/.exec(url);
      if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
      else parts.push({ text: `[image: ${url}]` });
    }
  }
  return parts.length ? parts : [{ text: '' }];
}

const DEFAULT_SYSTEM = `You are the AI assistant inside the GrabnWear admin panel (a Pakistani fashion e-commerce store, prices in PKR).
Be concise, practical and actionable. Use markdown.
If — and only if — the admin explicitly asks to navigate somewhere, end your reply with a tag like [NAVIGATE:products] using one of:
dashboard, products, categories, collections, orders, customers, discounts, inventory, reviews, blog, pages, shipping, settings, home.`;

function sseChunk(text: string) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`;
}

export const Route = createFileRoute('/api/public/ai-chat')({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'content-type, authorization',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
          },
        }),
      POST: async ({ request }) => {
        const key = process.env.GOOGLE_AI_API_KEY;
        if (!key) {
          return Response.json({ error: 'AI is not configured (missing API key).' }, { status: 500 });
        }

        let body: { messages?: IncomingMessage[]; generateImage?: boolean };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
        }

        const messages = Array.isArray(body.messages) ? body.messages.slice(-24) : [];
        if (!messages.length) return Response.json({ error: 'messages are required' }, { status: 400 });

        const systemMessages = messages.filter((m) => m.role === 'system');
        const chatMessages = messages.filter((m) => m.role !== 'system');

        const systemText =
          systemMessages.map((m) => (typeof m.content === 'string' ? m.content : '')).join('\n\n') ||
          DEFAULT_SYSTEM;

        const contents = chatMessages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: toParts(m.content),
        }));

        /* ------------------------------ image mode ----------------------------- */
        if (body.generateImage) {
          const prompt = (() => {
            const last = chatMessages[chatMessages.length - 1];
            const p = toParts(last?.content ?? '');
            return p.map((x) => ('text' in x ? x.text : '')).join(' ').trim();
          })();

          const res = await fetch(`${API}/${IMAGE_MODEL}:generateContent`, {
            method: 'POST',
            headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      text: `Create a high quality, premium e-commerce marketing image for a Pakistani fashion brand. ${prompt}`,
                    },
                  ],
                },
              ],
            }),
          });

          if (!res.ok) {
            const detail = await res.text().catch(() => '');
            console.error('[ai-chat] image error', res.status, detail);
            return Response.json(
              {
                text: 'Image generation is unavailable on the current AI plan. I can still write copy, descriptions and campaign ideas for you.',
              },
              { status: 200 },
            );
          }

          const data: any = await res.json();
          const parts = data?.candidates?.[0]?.content?.parts ?? [];
          const images: string[] = [];
          let text = '';
          for (const p of parts) {
            if (p.inlineData?.data) {
              images.push(`data:${p.inlineData.mimeType || 'image/png'};base64,${p.inlineData.data}`);
            } else if (p.text) text += p.text;
          }
          return Response.json({ text: text || 'Here is the image I generated.', images });
        }

        /* ------------------------------ stream mode ---------------------------- */
        const upstream = await fetch(`${API}/${TEXT_MODEL}:streamGenerateContent?alt=sse`, {
          method: 'POST',
          headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: systemText }] },
            generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => '');
          console.error('[ai-chat] upstream error', upstream.status, detail);
          const message =
            upstream.status === 429
              ? 'AI rate limit reached on the free plan. Please wait a moment and try again.'
              : 'AI service error. Please try again.';
          return Response.json({ error: message }, { status: 502 });
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            let buffer = '';
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                let idx: number;
                while ((idx = buffer.indexOf('\n')) !== -1) {
                  const line = buffer.slice(0, idx).replace(/\r$/, '');
                  buffer = buffer.slice(idx + 1);
                  if (!line.startsWith('data:')) continue;
                  const json = line.slice(5).trim();
                  if (!json || json === '[DONE]') continue;
                  try {
                    const parsed = JSON.parse(json);
                    const text = (parsed?.candidates?.[0]?.content?.parts ?? [])
                      .map((p: any) => p?.text ?? '')
                      .join('');
                    if (text) controller.enqueue(encoder.encode(sseChunk(text)));
                  } catch {
                    /* partial chunk, ignore */
                  }
                }
              }
            } catch (err) {
              console.error('[ai-chat] stream failure', err);
            } finally {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          },
        });
      },
    },
  },
});
