import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit, BarChart3, Users, CalendarDays, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Navbar from '@/components/Navbar';
import { fetchEvents, mockEvents, deleteEvent, updateEvent } from '@/lib/api';
import { EventData, EventCategory } from '@/types/event';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventData[]>(mockEvents);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [editForm, setEditForm] = useState<Partial<EventData>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents().then(setEvents);
  }, []);

  const handleDelete = async (id: string) => {
    await deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
    toast({ title: 'Deleted', description: 'Event removed successfully' });
  };

  const handleEdit = (event: EventData) => {
    setEditingEvent(event);
    setEditForm({ name: event.name, date: event.date, time: event.time, venue: event.venue });
  };

  const handleSaveEdit = async () => {
    if (!editingEvent) return;
    const updated = await updateEvent(editingEvent.id, editForm);
    if (updated) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...editForm } : e));
      toast({ title: 'Updated', description: 'Event updated successfully' });
    }
    setEditingEvent(null);
  };

  // Stats
  const stats = [
    { label: 'Total Events', value: events.length, icon: CalendarDays, color: 'text-primary' },
    { label: 'Categories', value: new Set(events.map(e => e.category)).size, icon: BarChart3, color: 'text-accent' },
    { label: 'This Month', value: events.filter(e => e.date.startsWith('2026-04')).length, icon: TrendingUp, color: 'text-success' },
    { label: 'Upcoming', value: events.filter(e => new Date(e.date) > new Date()).length, icon: Users, color: 'text-warning' },
  ];

  const categoryCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground mb-8">Manage events, view analytics, and monitor system health.</p>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <Card key={s.label} className="p-5 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="font-display text-2xl font-bold text-card-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Category distribution */}
          <Card className="p-5 shadow-card mb-8">
            <h3 className="font-display font-semibold text-card-foreground mb-4">Category Distribution</h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-foreground">{cat}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Events table */}
          <Card className="shadow-card overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="font-display font-semibold text-card-foreground">All Events</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map(event => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell><Badge variant="outline">{event.category}</Badge></TableCell>
                      <TableCell className="max-w-48 truncate">{event.venue}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
            </div>
            <div>
              <Label>Time</Label>
              <Input value={editForm.time || ''} onChange={e => setEditForm({ ...editForm, time: e.target.value })} />
            </div>
            <div>
              <Label>Venue</Label>
              <Input value={editForm.venue || ''} onChange={e => setEditForm({ ...editForm, venue: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
