'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle as CardTitleUI } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface WorkHoursDialogProps {
  specialistId: string;
  specialistName: string;
  workHours?: Array<{
    id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
  }>;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WorkHoursDialog({ specialistId, specialistName, workHours = [] }: WorkHoursDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hours, setHours] = useState<Record<number, { start_time: string; end_time: string }>>(
    workHours.reduce((acc, h) => {
      acc[h.day_of_week] = { start_time: h.start_time, end_time: h.end_time };
      return acc;
    }, {} as Record<number, { start_time: string; end_time: string }>)
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete existing work hours
      await supabase
        .from('specialist_work_hours')
        .delete()
        .eq('specialist_id', specialistId);

      // Insert new work hours
      const hoursToInsert = Object.entries(hours).map(([day, times]) => ({
        specialist_id: specialistId,
        day_of_week: parseInt(day),
        start_time: times.start_time,
        end_time: times.end_time,
      }));

      if (hoursToInsert.length > 0) {
        const { error } = await supabase
          .from('specialist_work_hours')
          .insert(hoursToInsert);

        if (error) throw error;
      }

      alert('Work hours updated successfully');
      setOpen(false);
    } catch (err) {
      console.error('Error saving work hours:', err);
      alert('Failed to save work hours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Clock className="w-4 h-4" />
          Work Hours
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Work Hours for {specialistName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {DAYS.map((day, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <CardTitleUI className="text-sm">{day}</CardTitleUI>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium">Start Time</label>
                    <Input
                      type="time"
                      value={hours[idx]?.start_time || '09:00'}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [idx]: { ...hours[idx], start_time: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">End Time</label>
                    <Input
                      type="time"
                      value={hours[idx]?.end_time || '17:00'}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [idx]: { ...hours[idx], end_time: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Work Hours'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
