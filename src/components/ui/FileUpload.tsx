'use client';

import { useState, useRef, type ChangeEvent, type FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, FileCheck, X, Check, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadProps {
  label?: string;
  description?: string;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export const FileUpload: FC<FileUploadProps> = ({
  label = 'Upload Verification Document',
  description = 'Drag and drop files here, or click to browse (PDF, PNG, JPG up to 10MB)',
  accept = 'image/*,.pdf',
  maxSizeMb = 10,
  onFileSelect,
  className = '',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (f.size > maxSizeMb * 1024 * 1024) {
      alert(`File exceeds max size of ${maxSizeMb}MB`);
      return;
    }
    setFile(f);
    setUploading(true);
    setProgress(0);

    // Simulate spring upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          onFileSelect?.(f);
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      {label && <div className="text-xs font-bold text-[var(--text-high)]">{label}</div>}

      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center',
            isDragging
              ? 'border-[var(--brand)] bg-[rgba(0,87,255,0.06)] scale-[0.99]'
              : 'border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] hover:border-[var(--brand)]'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-[rgba(0,87,255,0.08)] text-[var(--brand)] flex items-center justify-center mb-2.5">
            <UploadCloud size={20} />
          </div>
          <span className="text-xs font-bold text-[var(--text-high)]">Click to upload or drag & drop</span>
          <span className="text-[11px] text-[var(--text-low)] mt-1 max-w-xs">{description}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-1)] shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[rgba(0,87,255,0.1)] text-[var(--brand)] flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[var(--text-high)] truncate">{file.name}</span>
                <span className="text-[10.5px] text-[var(--text-low)] font-mono">{formatSize(file.size)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {!uploading && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <Check size={11} strokeWidth={3} /> Uploaded
                </span>
              )}
              <button
                onClick={() => { setFile(null); setProgress(0); }}
                className="p-1 text-[var(--text-low)] hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                aria-label="Remove uploaded file"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden mt-1">
              <motion.div
                className="h-full bg-[var(--brand)] rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeInOut' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
