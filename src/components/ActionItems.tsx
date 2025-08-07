import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CheckSquare, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  due_date: string;
  status: 'To Do' | 'Done';
  meeting_id?: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
}

interface ActionItemsProps {
  actionItems: ActionItem[];
  meetings: Meeting[];
  onUpdate: () => void;
}

export function ActionItems({ actionItems, meetings, onUpdate }: ActionItemsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    assignee: '',
    due_date: undefined as Date | undefined,
    meeting_id: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.assignee || !formData.due_date) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('action_items')
        .insert({
          description: formData.description,
          assignee: formData.assignee,
          due_date: format(formData.due_date, 'yyyy-MM-dd'),
          meeting_id: formData.meeting_id || null
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Action item created successfully",
      });
      
      setFormData({ description: '', assignee: '', due_date: undefined, meeting_id: '' });
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create action item",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'To Do' ? 'Done' : 'To Do';
      const { error } = await supabase
        .from('action_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Task marked as ${newStatus}`,
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const getMeetingTitle = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    return meeting ? meeting.title : 'No meeting assigned';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Action Items
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Action Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Action Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Update website content"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="assignee">Assignee</Label>
                <Input
                  id="assignee"
                  value={formData.assignee}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignee: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.due_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.due_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, due_date: date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="meeting">Related Meeting (optional)</Label>
                <Select value={formData.meeting_id} onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a meeting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No meeting</SelectItem>
                    {meetings.map((meeting) => (
                      <SelectItem key={meeting.id} value={meeting.id}>
                        {meeting.title} - {format(new Date(meeting.date), 'MMM dd')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full">Create Action Item</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {actionItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No action items yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Meeting</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionItems.map((item) => (
                <TableRow key={item.id} className={item.status === 'Done' ? 'opacity-75' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={item.status === 'Done'}
                      onCheckedChange={() => toggleStatus(item.id, item.status)}
                    />
                  </TableCell>
                  <TableCell className={item.status === 'Done' ? 'line-through' : ''}>
                    {item.description}
                  </TableCell>
                  <TableCell>{item.assignee}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {format(new Date(item.due_date), 'MMM dd, yyyy')}
                      {new Date(item.due_date) < new Date() && item.status === 'To Do' && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.meeting_id ? getMeetingTitle(item.meeting_id) : 'No meeting'}
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