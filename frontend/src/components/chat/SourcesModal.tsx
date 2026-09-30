import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Hash, Percent, Layers } from 'lucide-react';
import { SourceItem } from '../../types';

interface SourcesModalProps {
  sources: SourceItem[] | null;
  onClose: () => void;
}

export const SourcesModal: React.FC<SourcesModalProps> = ({ sources, onClose }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-panel w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col border border-slate-700/80 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Retrieved Source Chunks</h3>
                <p className="text-xs text-slate-400">Inspecting {sources.length} chunk(s) from ChromaDB</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Source Chunks List */}
          <div className="p-4 md:p-6 overflow-y-auto space-y-4">
            {sources.map((src, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
              >
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 text-xs">
                  <div className="flex items-center gap-2 font-medium text-blue-400">
                    <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>{src.source}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-indigo-400" />
                      Chunk #{src.chunk_index}
                    </span>
                    <span className="flex items-center gap-1 font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Percent className="w-3 h-3" />
                      Score: {(src.score * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Text Snippet Content */}
                <div className="text-xs md:text-sm text-slate-300 font-mono leading-relaxed bg-slate-950/50 p-3 rounded-lg border border-slate-800/60 whitespace-pre-wrap">
                  {src.snippet}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/40">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
