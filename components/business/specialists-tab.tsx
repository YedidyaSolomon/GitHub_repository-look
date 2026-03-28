'use client';

import { useState } from 'react';
import { Specialist, supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit } from 'lucide-react';

interface SpecialistsTabProps {
  businessId: string;
  specialists: Specialist[];
  setSpecialists: (specialists: Specialist[]) => void;
}

export default function SpecialistsTab({ businessId, specialists, setSpecialists }: SpecialistsTabProps) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '' });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from('specialists')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        setSpecialists(
          specialists.map((s) => (s.id === editingId ? { ...s, ...formData } : s))
        );
      } else {
        // Insert
        const { data, error } = await supabase
          .from('specialists')
          .insert({
            business_id: businessId,
            ...formData,
            availability: true,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setSpecialists([...specialists, data]);
      }

      setOpen(false);
      resetForm();
    } catch (err) {
      console.error('Error saving specialist:', err);
      alert('Failed to save specialist');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this specialist?')) return;

    try {
      const { error } = await supabase.from('specialists').delete().eq('id', id);
      if (error) throw error;
      setSpecialists(specialists.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error deleting specialist:', err);
      alert('Failed to delete specialist');
    }
  };

  const handleAvailabilityToggle = async (specialist: Specialist) => {
    try {
      const { error } = await supabase
        .from('specialists')
        .update({ availability: !specialist.availability })
        .eq('id', specialist.id);

      if (error) throw error;

      setSpecialists(
        specialists.map((s) =>
          s.id === specialist.id ? { ...s, availability: !s.availability } : s
        )
      );
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('Failed to update availability');
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Specialists</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Specialist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Specialist</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <Input
                  placeholder="Specialist name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="specialist@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Save Specialist'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {specialists.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No specialists yet. Add your first specialist to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialists.map((specialist) => (
                <TableRow key={specialist.id}>
                  <TableCell className="font-medium">{specialist.name}</TableCell>
                  <TableCell>{specialist.email}</TableCell>
                  <TableCell>{specialist.phone}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={specialist.availability}
                        onCheckedChange={() => handleAvailabilityToggle(specialist)}
                      />
                      <Badge variant={specialist.availability ? 'default' : 'secondary'}>
                        {specialist.availability ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          name: specialist.name,
                          email: specialist.email,
                          phone: specialist.phone,
                        });
                        setEditingId(specialist.id);
                        setOpen(true);
                      }}
                      title="Edit specialist details"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(specialist.id)}
                      title="Delete specialist"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
