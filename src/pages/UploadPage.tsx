import Navbar from '@/components/Navbar';
import FileUploader from '@/components/FileUploader';
import { motion } from 'framer-motion';

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Upload Event Poster</h1>
          <p className="text-muted-foreground mb-8">
            Upload an event poster and our AI will automatically extract event details using OCR and NLP.
          </p>
          <FileUploader />
        </motion.div>
      </main>
    </div>
  );
}
