import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Send, Sparkles, Loader2, Copy, Check, ImagePlus, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';

type MsgContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
type Msg = { role: 'user' | 'assistant'; content: MsgContent; images?: string[] };

const CHAT_URL = '/api/public/ai-chat';

const QUICK_PROMPTS = [
  'Write a product description for a hoodie',
  'Generate a hero banner image for my store',
  'Give me 5 Instagram caption ideas',
  'Suggest a discount strategy for Eid sale',
  'Navigate me to the products page',
];

const NAV_ROUTES: Record<string, string> = {
  dashboard: '/admin',
  products: '/admin/products',
  categories: '/admin/categories',
  collections: '/admin/collections',
  orders: '/admin/orders',
  customers: '/admin/customers',
  discounts: '/admin/discounts',
  inventory: '/admin/inventory',
  reviews: '/admin/reviews',
  blog: '/admin/blog',
  pages: '/admin/pages',
  shipping: '/admin/shipping',
  settings: '/admin/settings',
  home: '/',
  storefront: '/',
};

function getTextContent(content: MsgContent): string {
  if (typeof content === 'string') return content;
  return content.filter(c => c.type === 'text').map(c => (c as any).text).join('');
}

const STORAGE_KEY = 'grabnwear-ai-chat-history';

const loadHistory = (): Msg[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const saveHistory = (msgs: Msg[]) => {
  try {
    // Keep last 50 messages to avoid localStorage bloat
    const toSave = msgs.slice(-50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch { /* ignore */ }
};

const NAV_KEYWORDS = ['navigate', 'go to', 'take me to', 'open', 'switch to', 'show me the'];

const userAskedToNavigate = (msgs: Msg[]): boolean => {
  // Check if the last user message contains navigation intent
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'user') {
      const text = getTextContent(msgs[i].content).toLowerCase();
      return NAV_KEYWORDS.some(kw => text.includes(kw));
    }
  }
  return false;
};

const AdminAIChat = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Persist messages on change
  useEffect(() => {
    if (messages.length > 0) saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAttachedImage(reader.result as string);
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Check for navigation intent in AI response — only act if user asked
  const handleNavigation = (text: string, allMsgs: Msg[]) => {
    if (!userAskedToNavigate(allMsgs)) return; // Don't navigate unless user asked
    const navMatch = text.match(/\[NAVIGATE:([^\]]+)\]/);
    if (navMatch) {
      const target = navMatch[1].trim().toLowerCase();
      const route = NAV_ROUTES[target] || target;
      if (route.startsWith('/')) {
        navigate(route);
        toast.success(`Navigated to ${target}`);
      }
    }
  };

  // Strip [NAVIGATE:...] tags from displayed text
  const stripNavTags = (text: string) => text.replace(/\[NAVIGATE:[^\]]+\]/g, '').trim();

  const send = async (text: string) => {
    if ((!text.trim() && !attachedImage) || loading) return;

    // Build message content
    let userContent: MsgContent;
    const userImages: string[] = [];

    if (attachedImage) {
      userContent = [
        { type: 'text', text: text.trim() || 'What do you see in this image?' },
        { type: 'image_url', image_url: { url: attachedImage } },
      ];
      userImages.push(attachedImage);
    } else {
      userContent = text.trim();
    }

    const userMsg: Msg = { role: 'user', content: userContent, images: userImages.length > 0 ? userImages : undefined };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setAttachedImage(null);
    setLoading(true);

    // Prepare messages for API (flatten for the backend)
    const apiMessages = allMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    let assistantSoFar = '';
    let assistantImages: string[] = [];

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          generateImage: (() => {
            const t = text.toLowerCase();
            const actionWords = ['generate', 'create', 'make', 'design', 'draw', 'build', 'produce', 'craft'];
            const imageWords = ['image', 'banner', 'photo', 'picture', 'poster', 'graphic', 'visual', 'hero', 'thumbnail', 'logo', 'icon', 'illustration', 'artwork', 'flyer', 'slide'];
            return actionWords.some(a => t.includes(a)) && imageWords.some(i => t.includes(i));
          })(),
        }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: 'Failed to connect' }));
        toast.error(err.error || 'AI service error');
        setLoading(false);
        return;
      }

      // Check if it's a JSON response (image generation) vs SSE stream
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await resp.json();
        assistantSoFar = data.text || '';
        if (data.images) assistantImages = data.images;
        setMessages(prev => [...prev, { role: 'assistant', content: assistantSoFar, images: assistantImages.length > 0 ? assistantImages : undefined }]);
        handleNavigation(assistantSoFar, allMessages);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      handleNavigation(assistantSoFar, allMessages);
    } catch (e) {
      console.error(e);
      toast.error('Failed to connect to AI');
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageAttach} />

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          open ? 'bg-destructive text-destructive-foreground rotate-0' : 'bg-primary text-primary-foreground hover:scale-110'
        }`}
      >
        {open ? <X className="h-5 w-5" /> : <Bot className="h-6 w-6" />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in" style={{ height: '560px' }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-primary/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Assistant</p>
              <p className="text-[10px] text-muted-foreground">Chat · Images · Navigation</p>
            </div>
            <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY); }}>Clear</Button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center pt-4">
                <Bot className="h-10 w-10 mx-auto text-primary/30 mb-3" />
                <p className="text-sm font-medium mb-1">How can I help?</p>
                <p className="text-xs text-muted-foreground mb-4">Ask anything, attach images, or generate visuals</p>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((q, i) => (
                    <button key={i} onClick={() => send(q)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors truncate">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm relative group ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-secondary rounded-bl-sm'
                }`}>
                  {/* User attached images */}
                  {m.images && m.images.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {m.images.map((img, idx) => (
                        <img key={idx} src={img} alt="Attached" className="rounded-lg max-h-40 w-auto object-cover" />
                      ))}
                    </div>
                  )}
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm prose-slate dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                      <ReactMarkdown>{stripNavTags(getTextContent(m.content))}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{getTextContent(m.content)}</p>
                  )}
                  {m.role === 'assistant' && getTextContent(m.content) && (
                    <button onClick={() => copyText(getTextContent(m.content), i)}
                      className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary">
                      {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-secondary px-3 py-2 rounded-xl rounded-bl-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Attached image preview */}
          {attachedImage && (
            <div className="px-3 pb-1">
              <div className="relative inline-block">
                <img src={attachedImage} alt="Attached" className="h-16 rounded-lg border" />
                <button onClick={() => setAttachedImage(null)} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">×</button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="ghost" className="h-10 w-10 p-0 shrink-0" onClick={() => fileRef.current?.click()} title="Attach image">
                <Paperclip className="h-4 w-4" />
              </Button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything, attach images..."
                rows={1}
                className="flex-1 resize-none bg-secondary rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
              <Button size="sm" onClick={() => send(input)} disabled={(!input.trim() && !attachedImage) || loading} className="h-10 w-10 p-0 rounded-xl shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminAIChat;
