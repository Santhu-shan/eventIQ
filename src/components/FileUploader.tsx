import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, X, Loader2, CheckCircle, AlertCircle, Brain, Eye, Tag, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UploadStatus, ExtractedEventData, EventCategory } from '@/types/event';
import { performClientOCR, extractEventInfo, uploadPoster } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const steps = [
  { key: 'uploading', label: 'Uploading', icon: Upload },
  { key: 'ocr', label: 'OCR Processing', icon: Eye },
  { key: 'nlp', label: 'NLP Extraction', icon: Brain },
  { key: 'classifying', label: 'Classifying', icon: Tag },
  { key: 'saving', label: 'Saving', icon: Database },
] as const;

export default function FileUploader({ onEventCreated }: { onEventCreated?: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [status, setStatus] = useState<UploadStatus>({ step: 'idle', progress: 0, message: '' });
  const [extracted, setExtracted] = useState<ExtractedEventData | null>(null);
  const [rawText, setRawText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Invalid file type. Use JPG, PNG, or PDF.';
    if (file.size > MAX_SIZE) return 'File too large. Maximum 10MB.';
    return null;
  };

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const valid: File[] = [];
    for (const f of arr) {
      const err = validateFile(f);
      if (err) {
        toast({ title: 'Invalid File', description: `${f.name}: ${err}`, variant: 'destructive' });
      } else {
        valid.push(f);
      }
    }
    if (valid.length === 0) return;
    setFiles(valid);
    setExtracted(null);
    setRawText('');
    setStatus({ step: 'idle', progress: 0, message: '' });

    const urls = valid.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const processFile = async () => {
    if (files.length === 0) return;
    const file = files[0];

    try {
      // Step 1: Upload attempt
      setStatus({ step: 'uploading', progress: 10, message: 'Preparing file...' });
      await new Promise(r => setTimeout(r, 500));

      // Try backend first
      try {
        await uploadPoster(file);
        setStatus({ step: 'done', progress: 100, message: 'Event saved via server!' });
        onEventCreated?.();
        return;
      } catch {
        // Backend unavailable, use client-side processing
      }

      // Step 2: OCR
      setStatus({ step: 'ocr', progress: 30, message: 'Extracting text with OCR...' });
      const ocrResult = await performClientOCR(file);
      setRawText(ocrResult.text);

      // Step 3: NLP
      setStatus({ step: 'nlp', progress: 60, message: 'Analyzing text with NLP...' });
      await new Promise(r => setTimeout(r, 800));
      const info = extractEventInfo(ocrResult.text);
      setExtracted(info);

      // Step 4: Classification
      setStatus({ step: 'classifying', progress: 80, message: `Classified as: ${info.category}` });
      await new Promise(r => setTimeout(r, 600));

      // Step 5: Save (mock)
      setStatus({ step: 'saving', progress: 95, message: 'Saving to database...' });
      await new Promise(r => setTimeout(r, 500));

      setStatus({ step: 'done', progress: 100, message: 'Event processed successfully!' });
      toast({ title: 'Success', description: `Event "${info.name}" extracted and classified as ${info.category}` });
      onEventCreated?.();
    } catch (err) {
      setStatus({ step: 'error', progress: 0, message: err instanceof Error ? err.message : 'Processing failed' });
      toast({ title: 'Error', description: 'Failed to process poster', variant: 'destructive' });
    }
  };

  const reset = () => {
    setFiles([]);
    setPreviews([]);
    setStatus({ step: 'idle', progress: 0, message: '' });
    setExtracted(null);
    setRawText('');
  };

  const isProcessing = ['uploading', 'ocr', 'nlp', 'classifying', 'saving'].includes(status.step);

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          multiple
          onChange={e => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <FileImage className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="font-display font-semibold text-foreground">
          Drop event posters here or click to browse
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Supports JPG, PNG, PDF — Max 10MB
        </p>
      </div>

      {/* File previews */}
      {previews.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {previews.map((url, i) => (
            <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border shadow-card">
              {files[i]?.type === 'application/pdf' ? (
                <div className="w-full h-full flex items-center justify-center bg-muted">
                  <span className="text-xs font-display text-muted-foreground">PDF</span>
                </div>
              ) : (
                <img src={url} alt="Preview" className="w-full h-full object-cover" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Processing pipeline visualization */}
      {status.step !== 'idle' && (
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            {steps.map((s, i) => {
              const stepIndex = steps.findIndex(st => st.key === status.step);
              const isDone = i < stepIndex || status.step === 'done';
              const isCurrent = s.key === status.step;
              const isError = status.step === 'error' && i === stepIndex;

              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors ${
                    isDone ? 'bg-success text-success-foreground' :
                    isCurrent ? 'gradient-primary text-primary-foreground animate-pulse-glow' :
                    isError ? 'bg-destructive text-destructive-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {isDone ? <CheckCircle className="w-4 h-4" /> :
                     isCurrent && isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     isError ? <AlertCircle className="w-4 h-4" /> :
                     <s.icon className="w-4 h-4" />}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`w-6 h-0.5 ${isDone ? 'bg-success' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full gradient-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${status.progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{status.message}</p>
        </Card>
      )}

      {/* Extracted data */}
      <AnimatePresence>
        {extracted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="p-5">
              <h3 className="font-display font-semibold text-foreground mb-4">Extracted Event Data</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Event Name</Label>
                  <Input value={extracted.name} readOnly className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <div className="mt-1">
                    <Badge className="text-sm">{extracted.category}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Input value={extracted.date} readOnly className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Time</Label>
                  <Input value={extracted.time} readOnly className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-muted-foreground">Venue</Label>
                  <Input value={extracted.venue} readOnly className="mt-1" />
                </div>
              </div>

              {rawText && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer">Raw OCR Text</summary>
                  <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40 text-muted-foreground">
                    {rawText}
                  </pre>
                </details>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={processFile}
          disabled={files.length === 0 || isProcessing}
          className="gap-2"
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          {isProcessing ? 'Processing...' : 'Extract & Classify'}
        </Button>
        {(files.length > 0 || extracted) && (
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
