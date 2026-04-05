import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import EventCard from '@/components/EventCard';
import SearchFilterBar from '@/components/SearchFilterBar';
import Navbar from '@/components/Navbar';
import { fetchEvents, mockEvents } from '@/lib/api';
import { useEventFilter } from '@/hooks/useEventFilter';
import { EventData } from '@/types/event';

export default function HomePage() {
  const [events, setEvents] = useState<EventData[]>(mockEvents);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents().then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const { search, setSearch, category, setCategory, dateRange, setDateRange, filtered, reset } = useEventFilter(events);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="gradient-hero py-16 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-background/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">AI-Powered Event Discovery</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-3">
              EventIQ
            </h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              Automatically extract, classify, and discover events from posters using OCR and NLP
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <main className="container mx-auto px-4 -mt-8 relative z-10 pb-16">
        <div className="bg-card rounded-xl shadow-elevated p-6 mb-8">
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={reset}
            resultCount={filtered.length}
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-display text-lg">No events found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event, i) => (
              <EventCard key={event.id} event={event} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
