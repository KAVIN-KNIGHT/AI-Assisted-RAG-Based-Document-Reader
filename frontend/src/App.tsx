import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Trash2,
  RefreshCw,
  Info
} from 'lucide-react';
import { Sidebar } from './components/layout/Sidebar';
import { MessageItem } from './components/chat/MessageItem';
import { ChatInput } from './components/chat/ChatInput';
import { SourcesModal } from './components/chat/SourcesModal';
import { FileDropzone } from './components/upload/FileDropzone';
import { DocumentStatsModal } from './components/stats/DocumentStatsModal';
import { fetchDocuments, deleteDocuments, sendChatMessage, fetchHealth } from './services/api';
import { ChatMessage, DocumentInfo, SourceItem, UploadResponse } from './types';
import { exportToMarkdown, exportToPDF } from './utils/exportUtils';
import { ThemeProvider } from './contexts/ThemeContext';

export const AppContent: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [activeCollection, setActiveCollection] = useState('documents');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [inspectedSources, setInspectedSources] = useState<SourceItem[] | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const loadDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const docs = await fetchDocuments(activeCollection);
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeCollection]);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isChatLoading]);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const res = await sendChatMessage(text, activeCollection, 5);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        search_latency_ms: res.search_latency_ms,
        answer_latency_ms: res.answer_latency_ms,
        total_latency_ms: res.total_latency_ms,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorContent =
        err.response?.data?.detail || err.message || 'An error occurred while getting an answer.';

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Error**: ${errorContent}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleClearDatabase = async () => {
    if (window.confirm('Are you sure you want to delete all indexed documents from ChromaDB?')) {
      try {
        await deleteDocuments(activeCollection);
        setDocuments([]);
        setMessages([]);
      } catch (err) {
        console.error('Failed to clear database:', err);
      }
    }
  };

  const handleUploadSuccess = (res: UploadResponse) => {
    loadDocuments();
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 select-none">
      {/* Left Sidebar */}
      <Sidebar
        documents={documents}
        isLoadingDocs={isLoadingDocs}
        onOpenUpload={() => setIsUploadOpen(true)}
        onClearChat={handleClearChat}
        onClearDatabase={handleClearDatabase}
        onOpenStats={() => setIsStatsOpen(true)}
        onRefreshDocs={loadDocuments}
        activeCollection={activeCollection}
      />

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
        {/* Top Navigation Header */}
        <header className="h-16 px-6 glass-panel flex items-center justify-between border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-bold text-slate-200">
                Document RAG Assistant
              </h2>
              <p className="text-[11px] text-slate-400">
                {documents.length > 0
                  ? `Active knowledge base: ${documents.length} document(s)`
                  : 'No documents loaded in current collection'}
              </p>
            </div>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <button
                  onClick={() => exportToMarkdown(messages)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700/50 transition-colors cursor-pointer"
                  title="Export conversation to Markdown"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">Export .MD</span>
                </button>
                <button
                  onClick={() => exportToPDF(messages)}
                  className="py-1.5 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700/50 transition-colors cursor-pointer"
                  title="Export conversation to PDF"
                >
                  <Download className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Export .PDF</span>
                </button>
              </>
            )}

            <button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="py-1.5 px-3 rounded-lg bg-slate-800/40 hover:bg-slate-800/80 disabled:opacity-40 text-slate-400 text-xs font-medium flex items-center gap-1.5 border border-slate-700/40 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Feed</span>
            </button>
          </div>
        </header>

        {/* Chat Feed */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto px-4 select-none">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                What would you like to ask today?
              </h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Upload your PDF or Word (.docx) documents to extract insights, summarize research, or ask targeted context-aware questions.
              </p>

              {documents.length === 0 && (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  Upload Your First Document
                </button>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onInspectSources={(sources) => setInspectedSources(sources)}
              />
            ))
          )}

          {isChatLoading && (
            <div className="flex gap-4 p-4 rounded-2xl glass-panel max-w-2xl animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-800 rounded w-1/4" />
                <div className="h-3 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isChatLoading}
          hasDocuments={documents.length > 0}
        />
      </main>

      {/* Upload Modal */}
      <FileDropzone
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Sources Inspector Modal */}
      <SourcesModal
        sources={inspectedSources}
        onClose={() => setInspectedSources(null)}
      />

      {/* System Metrics Modal */}
      <DocumentStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
