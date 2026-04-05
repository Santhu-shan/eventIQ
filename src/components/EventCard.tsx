import { EventData, EventCategory } from '@/types/event';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const categoryColors: Record<EventCategory, string> = {
  'Seminar': 'bg-info text-info-foreground',
  'Workshop': 'bg-success text-success-foreground',
  'Hackathon': 'bg-primary text-primary-foreground',
  'Coding Challenge': 'bg-warning text-warning-foreground',
};

interface EventCardProps {
  event: EventData;
  index?: number;
}

export default function EventCard({ event, index = 0 }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Link to={`/event/${event.id}`}>
        <Card className="group overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          {/* Gradient header strip */}
          <div className="h-2 gradient-primary" />

          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-display font-semibold text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {event.name}
              </h3>
              <Badge className={`${categoryColors[event.category]} shrink-0 text-xs`}>
                {event.category}
              </Badge>
            </div>

            {event.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {event.description}
              </p>
            )}

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span className="line-clamp-1">{event.venue}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
