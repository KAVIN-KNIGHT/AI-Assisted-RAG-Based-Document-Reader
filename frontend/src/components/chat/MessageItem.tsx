import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import {
  Bot,
  User,
  Copy,
  Check,
  BookOpen,
  Zap,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { ChatMessage, SourceItem } from '../../types';

interface MessageItemProps {
  message: ChatMessage;
  onInspectSources: (sources: SourceItem[]) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onInspectSources }) => {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-4 p-4 md:p-5 rounded-2xl mb-4 ${
        isUser
          ? 'bg-blue-600/10 border border-blue-500/20 ml-auto max-w-3xl'
          : message.isError
          ? 'bg-red-500/10 border border-red-500/20 max-w-4xl'
          : 'glass-panel max-w-4xl'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isUser
            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
            : message.isError
            ? 'bg-red-500 text-white'
            : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : message.isError ? <AlertTriangle className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden space-y-3">
        {/* Header bar */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              {isUser ? 'You' : 'DocuBrain AI'}
            </span>
            <span>•</span>
            <span className="text-[11px] text-slate-400">{message.timestamp}</span>
          </div>

          {!isUser && (
            <div className="flex items-center gap-2">
              {message.total_latency_ms && (
                <div className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/50">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{message.total_latency_ms.toFixed(0)} ms</span>
                </div>
              )}
              <button
                onClick={handleCopyText}
                className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                title="Copy answer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Text Body / Markdown */}
        <div className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-200">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Source Citation Badges */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Retrieved Context ({message.sources.length} sources)</span>
              </div>
              <button
                onClick={() => onInspectSources(message.sources!)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 cursor-pointer"
              >
                View Full Snippets
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {message.sources.map((src, i) => (
                <div
                  key={i}
                  onClick={() => onInspectSources([src])}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate max-w-[140px]">{src.source}</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 text-[10px] font-mono">
                    {(src.score * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
