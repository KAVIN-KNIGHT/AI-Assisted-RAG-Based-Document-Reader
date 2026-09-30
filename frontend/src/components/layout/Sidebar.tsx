import React from 'react';
import {
  FileText,
  UploadCloud,
  Trash2,
  Sun,
  Moon,
  Database,
  RefreshCw,
  Sparkles,
  BarChart2,
  Layers
} from 'lucide-react';
import { DocumentInfo } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  documents: DocumentInfo[];
  isLoadingDocs: boolean;
  onOpenUpload: () => void;
  onClearChat: () => void;
  onClearDatabase: () => void;
  onOpenStats: () => void;
  onRefreshDocs: () => void;
  activeCollection: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  documents,
  isLoadingDocs,
  onOpenUpload,
  onClearChat,
  onClearDatabase,
  onOpenStats,
  onRefreshDocs,
  activeCollection,
}) => {
  const { theme, toggleTheme } = useTheme();

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunk_count, 0);

  return (
    <aside className="w-80 h-screen glass-panel flex flex-col justify-between p-4 border-r border-slate-800/50 select-none">
      {/* Header & Logo */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              DocuBrain RAG
            </h1>
            <p className="text-xs text-slate-400 font-medium">FastAPI + ChromaDB + Gemini</p>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all duration-200 active:scale-[0.98] cursor-pointer"
        >
          <UploadCloud className="w-5 h-5" />
          <span>Upload Documents</span>
        </button>

        {/* Active Collection Status Badge */}
        <div className="mt-4 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Collection: <strong className="text-slate-200">{activeCollection}</strong></span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
            {documents.length} Docs
          </span>
        </div>

        {/* Documents Section Header */}
        <div className="mt-6 flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Indexed Documents
          </span>
          <button
            onClick={onRefreshDocs}
            title="Refresh document index"
            className="p-1 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Document List */}
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {isLoadingDocs ? (
            <div className="text-center py-6 text-xs text-slate-500">Loading document index...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-slate-700/60 rounded-xl text-slate-500 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              No documents indexed yet.
              <br />
              Click "Upload Documents" to get started.
            </div>
          ) : (
            documents.map((doc, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-medium text-slate-200 truncate" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {doc.chunk_count} chunk(s) • {(doc.size_bytes / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-slate-800/60 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenStats}
            className="py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700/50 transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Metrics</span>
          </button>
          <button
            onClick={toggleTheme}
            className="py-2 px-3 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 border border-slate-700/50 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-purple-400" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={onClearChat}
          className="w-full py-2 px-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/70 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 border border-slate-700/40 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Clear Chat History</span>
        </button>

        <button
          onClick={onClearDatabase}
          className="w-full py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium flex items-center justify-center gap-2 border border-red-500/20 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Vector Index</span>
        </button>

        <div className="pt-2 text-[10px] text-center text-slate-500">
          ChromaDB Store: <strong className="text-slate-400">{totalChunks} chunks</strong> total
        </div>
      </div>
    </aside>
  );
};
