'use client';

import { useEffect, useState } from 'react';
import { Business, supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Eye } from 'lucide-react';

export default function AdminDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setBusinesses(data);
    } catch (err) {
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (businessId: string) => {
    setProcessingId(businessId);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ status: 'APPROVED' })
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(
        businesses.map((b) => (b.id === businessId ? { ...b, status: 'APPROVED' } : b))
      );
      alert('Business approved successfully!');
    } catch (err) {
      console.error('Error approving business:', err);
      alert('Failed to approve business');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (businessId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setProcessingId(businessId);
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ 
          status: 'SUSPENDED',
          rejection_reason: rejectionReason,
        })
        .eq('id', businessId);

      if (error) throw error;

      // Remove from pending list
      setBusinesses(
        businesses.filter((b) => b.id !== businessId)
      );

      setShowDetailsDialog(false);
      setRejectionReason('');
      alert('Business application rejected.');
    } catch (err) {
      console.error('Error rejecting business:', err);
      alert('Failed to reject business');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Spinner />
      </div>
    );
  }

  const pendingCount = businesses.filter((b) => b.status === 'PENDING').length;
  const approvedCount = businesses.filter((b) => b.status === 'APPROVED').length;
  const rejectedCount = businesses.filter((b) => b.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Businesses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Business Applications</CardTitle>
          <CardDescription>
            Review and manage business registrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No businesses yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">Business Name</TableHead>
                    <TableHead className="hidden md:table-cell">Owner</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="font-semibold text-sm">{business.name}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            <Badge className={getStatusColor(business.status)}>
                              {business.status}
                            </Badge>
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {business.owner_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge className={getStatusColor(business.status)}>
                          {business.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {new Date(business.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right space-x-1 sm:space-x-2">
                      <Dialog open={showDetailsDialog && selectedBusiness?.id === business.id} onOpenChange={(open) => {
                        setShowDetailsDialog(open);
                        if (!open) setRejectionReason('');
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBusiness(business);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{business.name}</DialogTitle>
                            <DialogDescription>
                              {business.description}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <Badge className={getStatusColor(business.status)} className="mt-1">
                                {business.status}
                              </Badge>
                            </div>

                            {business.status === 'PENDING' && (
                              <>
                                <Textarea
                                  placeholder="Rejection reason (if rejecting)"
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                />

                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleApprove(business.id)}
                                    disabled={processingId === business.id}
                                    className="flex-1"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleReject(business.id)}
                                    disabled={processingId === business.id}
                                    className="flex-1"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
