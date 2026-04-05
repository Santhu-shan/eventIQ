import { EventCategory } from '@/types/event';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

const categories: (EventCategory | 'All')[] = ['All', 'Seminar', 'Workshop', 'Hackathon', 'Coding Challenge'];

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  category: EventCategory | 'All';
  onCategoryChange: (c: EventCategory | 'All') => void;
  dateRange: { from: string; to: string };
  onDateRangeChange: (r: { from: string; to: string }) => void;
  onReset: () => void;
  resultCount: number;
}

export default function SearchFilterBar({
  search, onSearchChange, category, onCategoryChange,
  dateRange, onDateRangeChange, onReset, resultCount,
}: SearchFilterBarProps) {
  const hasFilters = search || category !== 'All' || dateRange.from || dateRange.to;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search events by name, venue, or description..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={category === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(cat)}
            className="text-xs"
          >
            {cat}
          </Button>
        ))}
      </div>

      {/* Date range */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">From:</span>
          <Input
            type="date"
            value={dateRange.from}
            onChange={e => onDateRangeChange({ ...dateRange, from: e.target.value })}
            className="w-auto text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">To:</span>
          <Input
            type="date"
            value={dateRange.to}
            onChange={e => onDateRangeChange({ ...dateRange, to: e.target.value })}
            className="w-auto text-sm"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onReset} className="gap-1 text-xs">
            <X className="w-3 h-3" /> Clear
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {resultCount} event{resultCount !== 1 ? 's' : ''} found
        </span>
      </div>
    </div>
  );
}
