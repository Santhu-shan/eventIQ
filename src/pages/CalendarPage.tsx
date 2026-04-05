import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { fetchEvents, mockEvents } from '@/lib/api';
import { EventData } from '@/types/event';
import { Link } from 'react-router-dom';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [events, setEvents] = useState<EventData[]>(mockEvents);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchEvents().then(setEvents);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.date === dateStr);
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-8">Event Calendar</h1>

          <Card className="shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="font-display text-xl font-semibold text-card-foreground">
                {MONTHS[month]} {year}
              </h2>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {DAYS.map(d => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

                return (
                  <div
                    key={i}
                    className={`min-h-24 p-1.5 border-b border-r ${!day ? 'bg-muted/30' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                          {day}
                        </span>
                        <div className="mt-1 space-y-0.5">
                          {dayEvents.slice(0, 2).map(e => (
                            <Link key={e.id} to={`/event/${e.id}`}>
                              <div className="text-[10px] px-1 py-0.5 rounded gradient-primary text-primary-foreground truncate cursor-pointer">
                                {e.name}
                              </div>
                            </Link>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Upcoming events list */}
          <div className="mt-8">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Events in {MONTHS[month]}
            </h3>
            <div className="space-y-3">
              {events
                .filter(e => {
                  const d = new Date(e.date);
                  return d.getMonth() === month && d.getFullYear() === year;
                })
                .map(event => (
                  <Link key={event.id} to={`/event/${event.id}`}>
                    <Card className="p-4 shadow-card hover:shadow-elevated transition-shadow flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium text-card-foreground">{event.name}</p>
                        <p className="text-sm text-muted-foreground">{event.date} · {event.time}</p>
                      </div>
                      <Badge variant="outline">{event.category}</Badge>
                    </Card>
                  </Link>
                ))
              }
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
