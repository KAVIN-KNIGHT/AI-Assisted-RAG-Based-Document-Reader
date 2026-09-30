import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadFiles } from '../../services/api';
import { UploadResponse } from '../../types';

interface FileDropzoneProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (response: UploadResponse) => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];
    Array.from(files).forEach((file) => {
      const ext = file.name.toLowerCase();
      if (ext.endsWith('.pdf') || ext.endsWith('.docx')) {
        validFiles.push(file);
      }
    });

    if (validFiles.length < files.length) {
      setErrorMessage('Some files were ignored. Only PDF and DOCX formats are supported.');
    } else {
      setErrorMessage(null);
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartUpload = async () => {
    if (selectedFiles.length === 0 || isUploading) return;
    setIsUploading(true);
    setErrorMessage(null);
    setUploadResult(null);

    try {
      const res = await uploadFiles(selectedFiles);
      setUploadResult(res);
      onUploadSuccess(res);
      setSelectedFiles([]);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to upload files.';
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="glass-panel w-full max-w-xl rounded-2xl flex flex-col border border-slate-700/80 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-100">Upload Documents</h3>
                <p className="text-xs text-slate-400">PDF or DOCX (Max 25 MB per file)</p>
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
            {/* Drag Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-blue-500 bg-blue-500/10 scale-[0.99]'
                  : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
              <UploadCloud className="w-12 h-12 text-blue-400 mx-auto mb-3 opacity-80" />
              <p className="text-sm font-semibold text-slate-200">
                Drag & drop your files here, or <span className="text-blue-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports PDF and Microsoft Word (.docx)</p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Upload Result Alert */}
            {uploadResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadResult.message}</span>
                </div>
                {uploadResult.skipped.length > 0 && (
                  <p className="text-slate-400 text-[11px]">
                    Skipped (already indexed): {uploadResult.skipped.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Selected File List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Selected Files ({selectedFiles.length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="text-slate-200 truncate">{file.name}</span>
                        <span className="text-slate-500 text-[10px]">
                          ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900/40">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleStartUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing & Embedding...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Process Files</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
