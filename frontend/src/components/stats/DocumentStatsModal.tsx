import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Database, FileText, HardDrive, Layers, Activity } from 'lucide-react';
import { fetchStats } from '../../services/api';
import { StatsResponse } from '../../types';

interface DocumentStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentStatsModal: React.FC<DocumentStatsModalProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetchStats()
        .then((res) => setStats(res))
        .catch((err) => console.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-panel w-full max-w-lg rounded-2xl flex flex-col border border-slate-700/80 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">System Metrics & Statistics</h3>
                <p className="text-xs text-slate-400">ChromaDB Vector Store & LLM Pipeline</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            {isLoading ? (
              <div className="text-center py-10 text-xs text-slate-400">Fetching live statistics...</div>
            ) : stats ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Documents</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100">{stats.total_documents}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Total Chunks</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100">{stats.total_chunks}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <span>Vector DB Size</span>
                  </div>
                  <p className="text-xl font-bold text-slate-100">{stats.db_size_mb} MB</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs">
                    <Database className="w-4 h-4 text-purple-400" />
                    <span>Vector Store</span>
                  </div>
                  <p className="text-xs font-semibold text-purple-400 truncate">ChromaDB Persistent</p>
                </div>

                <div className="col-span-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-400" /> Embedding Model
                    </span>
                    <span className="font-mono text-slate-200">{stats.embedding_model}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-400 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-400" /> LLM Model
                    </span>
                    <span className="font-mono text-slate-200">{stats.llm_model}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-900/40">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
