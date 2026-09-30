import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CornerDownLeft } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  hasDocuments: boolean;
}

const SUGGESTED_PROMPTS = [
  "Summarize the key findings in the uploaded documents.",
  "What are the main topics discussed?",
  "Extract important metrics, data points, or dates.",
  "List any recommendations or conclusions."
];

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, hasDocuments }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* Suggested Questions */}
      {!input && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(prompt)}
              disabled={isLoading}
              className="text-xs py-1.5 px-3 rounded-full bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      )}

      {/* Textarea Input Box */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel p-2.5 rounded-2xl flex items-end gap-2 border border-slate-700/60 shadow-xl focus-within:border-blue-500/50 transition-colors"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            hasDocuments
              ? "Ask any question about your uploaded documents... (Shift+Enter for line breaks)"
              : "Upload documents first to start asking questions..."
          }
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-slate-200 placeholder-slate-500 px-2 py-1.5 max-h-[180px]"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-2">
        <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for line break</span>
        <span className="flex items-center gap-1">
          <CornerDownLeft className="w-3 h-3" /> Gemini 2.0 Flash RAG Engine
        </span>
      </div>
    </div>
  );
};
