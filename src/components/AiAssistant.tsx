import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, BimElement } from '../types';
import { Send, Bot, Sparkles, MessageSquare, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { TranslationDict } from '../utils/translations';

interface AiAssistantProps {
  activeModelName: string;
  activeModelInfo: BimElement;
  selectedElementId: string | null;
  selectedElementInfo: any;
  t: TranslationDict;
  isRtl: boolean;
}

const SUGGESTED_PROMPTS = [
  {
    label: "IFC Schema Upgrade",
    prompt: "What are the primary differences between IFC2x3 and IFC4 schemas regarding structural elements?"
  },
  {
    label: "Structural Continuity",
    prompt: "How should structural engineers verify load-bearing continuity between column elements and slabs?"
  },
  {
    label: "Slab CO2 Footprint",
    prompt: "What are typical ways to reduce the embodied carbon footprint of concrete foundation slabs during construction?"
  },
  {
    label: "Fire safety specs",
    prompt: "What are standard international building codes (IBC) for fire-safety ratings of vertical core service shafts?"
  }
];

export const AiAssistant: React.FC<AiAssistantProps> = ({
  activeModelName,
  activeModelInfo,
  selectedElementId,
  selectedElementInfo,
  t,
  isRtl,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and update initial message when language changes
  useEffect(() => {
    const defaultText = `Hello! I am your AI BIM & Structural Engineering consultant. I have scanned the active architectural model: **${activeModelName}**.\n\nYou can ask me structural advice, inquire about IFC standards, or query details about any selected element! Try selecting an element in the viewer or choosing a topic below.`;
    const localizedText = t.welcomeMessage ? t.welcomeMessage.replace('{model}', activeModelName) : defaultText;
    
    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          {
            id: "init-msg",
            role: "assistant",
            text: localizedText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
      } else {
        return prev.map((msg) => 
          msg.id === "init-msg" ? { ...msg, text: localizedText } : msg
        );
      }
    });
  }, [t, activeModelName]);

  // Auto-scroll to latest chat bubble
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Communication bridge to receive prompts from Menu bar items
  useEffect(() => {
    const handleCustomPrompt = (e: Event) => {
      const customEvent = e as CustomEvent<{ prompt: string }>;
      if (customEvent.detail && customEvent.detail.prompt) {
        handleSendMessage(customEvent.detail.prompt);
      }
    };
    window.addEventListener('archi-ai-prompt', handleCustomPrompt);
    return () => window.removeEventListener('archi-ai-prompt', handleCustomPrompt);
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: `U-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      // Build context of the loaded model & selected element to feed the AI contextually
      const contextualModelInfo = {
        modelPresetName: activeModelName,
        totalElements: activeModelInfo.children?.length || 0,
        selectedElement: selectedElementId ? {
          id: selectedElementId,
          type: selectedElementInfo?.type,
          name: selectedElementInfo?.name,
          properties: selectedElementInfo?.properties,
        } : "None selected",
      };

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSend,
          history: messages.map(m => ({ role: m.role, text: m.text })),
          activeModelInfo: contextualModelInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMsg: ChatMessage = {
        id: `A-${Date.now()}`,
        role: "assistant",
        text: data.text || "I was unable to process that request.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Assistant chat error:", err);
      setErrorMsg(err.message || "Failed to contact the AI server. Check your API secrets.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    const defaultReset = `Chat reset. I am ready to analyze **${activeModelName}** or help you with custom structural/IFC design questions.`;
    const localizedReset = t.welcomeMessage ? t.welcomeMessage.replace('{model}', activeModelName) : defaultReset;

    setMessages([
      {
        id: "init-msg",
        role: "assistant",
        text: localizedReset,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setErrorMsg(null);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1a1a] border-l border-[#333] text-[#d1d1d1] text-[10px] overflow-hidden" id="ai-assistant-frame" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* AI Header */}
      <div className="p-2 border-b border-[#333] bg-[#1a1a1a] flex items-center justify-between" id="ai-sidebar-header">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-blue-400" />
          <div>
            <div className="font-semibold text-white flex items-center gap-1 text-[11px]">
              {t.aiConsultant} <Sparkles className="w-3 h-3 text-yellow-400" />
            </div>
            <div className="text-[9px] text-[#666] font-mono">Powered by Gemini 2.5 Flash</div>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="text-[#666] hover:text-rose-400 p-1 hover:bg-[#252525] rounded transition"
          title="Clear History"
          id="btn-clear-chat-log"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 bg-[#161616]" id="chat-messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[90%] ${msg.role === 'user' ? (isRtl ? 'mr-auto items-start' : 'ml-auto items-end') : (isRtl ? 'ml-auto' : 'mr-auto')}`}
            id={`chat-bubble-${msg.id}`}
          >
            {/* Bubble contents */}
            <div
              className={`px-2.5 py-1.5 leading-normal text-[10px] break-words ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white border border-blue-700 rounded-sm'
                  : 'bg-[#252525] border border-[#333] text-[#d1d1d1] rounded-sm'
              }`}
            >
              {/* If it's the bot, render markdown lists nicely */}
              <div className="select-text space-y-1.5">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
              </div>
            </div>
            
            {/* Timestamp label */}
            <span className="text-[8px] text-[#555] font-mono mt-0.5 px-0.5">{msg.timestamp}</span>
          </div>
        ))}

        {/* Loading Spinner */}
        {loading && (
          <div className={`flex items-center gap-1.5 text-[#888] bg-[#252525] border border-[#333] px-2 py-1.5 max-w-[80%] ${isRtl ? 'mr-auto' : 'ml-auto'}`} id="chat-bubble-loading">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
            <span className="animate-pulse">{t.typing}</span>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="bg-rose-950/20 border border-rose-500/30 text-rose-300 p-2 rounded text-[10px] flex gap-1.5" id="ai-chat-error-banner">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">BIM Engine Failure</div>
              <p className="mt-0.5 leading-normal">{errorMsg}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts list */}
      <div className="p-2 border-t border-[#333] bg-[#1a1a1a]" id="suggestions-dock">
        <span className="text-[8px] font-mono font-bold text-[#666] uppercase tracking-wider block mb-1 flex items-center gap-1">
          <MessageSquare className="w-2.5 h-2.5 text-blue-400" /> Suggested Inquiries
        </span>
        <div className="flex gap-1 overflow-x-auto pb-1 max-w-full scrollbar-thin select-none" id="chips-row">
          {SUGGESTED_PROMPTS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              className="bg-[#252525] hover:bg-blue-950/20 border border-[#333] hover:border-blue-500/30 text-[9px] text-[#888] hover:text-blue-400 px-2 py-1 whitespace-nowrap transition cursor-pointer"
              id={`suggested-chip-${idx}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message textbox input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-2 border-t border-[#333] bg-[#1a1a1a] flex gap-1.5"
        id="ai-message-input-form"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t.chatPlaceholder}
          className="flex-1 bg-[#252525] border border-[#333] text-white text-[10px] px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-[#555]"
          id="custom-prompt-input"
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-[#252525] disabled:text-[#444] disabled:border-[#333] border border-blue-700 text-white px-2 py-1 transition cursor-pointer"
          disabled={!inputText.trim() || loading}
          id="send-message-submit-btn"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
