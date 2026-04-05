import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowLeft, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import { fetchEventById } from '@/lib/api';
import { EventData } from '@/types/event';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEventById(id).then(data => {
        setEvent(data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-10 text-center">
          <p className="text-muted-foreground text-lg">Event not found</p>
          <Button variant="outline" onClick={() => navigate('/')} className="mt-4 gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-6 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="h-3 gradient-hero" />
            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <h1 className="font-display text-3xl font-bold text-card-foreground">{event.name}</h1>
                <Badge className="shrink-0">{event.category}</Badge>
              </div>

              {event.description && (
                <p className="text-muted-foreground mb-8 leading-relaxed">{event.description}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-card-foreground">{event.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="font-medium text-card-foreground">{event.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Venue</p>
                    <p className="font-medium text-card-foreground">{event.venue}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="w-3.5 h-3.5" />
                Created: {new Date(event.created_at).toLocaleDateString()}
              </div>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
