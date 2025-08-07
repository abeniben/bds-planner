import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar as CalendarIcon, ChevronDown, ChevronRight, Archive, Eye, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  agenda_items: string[];
  is_archived: boolean;
}

interface UpcomingMeetingsProps {
  meetings: Meeting[];
  onUpdate: () => void;
}

export function UpcomingMeetings({ meetings, onUpdate }: UpcomingMeetingsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expandedMeetings, setExpandedMeetings] = useState<Set<string>>(new Set());
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: undefined as Date | undefined,
    time: '',
    agenda_items: ''
  });
  const { toast } = useToast();

  const activeMeetings = useMemo(() => 
    meetings.filter(meeting => !meeting.is_archived), [meetings]
  );

  const archivedMeetings = useMemo(() => 
    meetings.filter(meeting => meeting.is_archived), [meetings]
  );

  const toggleMeetingExpansion = (meetingId: string, open: boolean) => {
    setExpandedMeetings(prev => {
      const newSet = new Set(prev);
      if (open) {
        newSet.add(meetingId);
      } else {
        newSet.delete(meetingId);
      }
      return newSet;
    });
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      title: meeting.title,
      date: new Date(meeting.date),
      time: meeting.time,
      agenda_items: meeting.agenda_items.join('\n')
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const agendaArray = formData.agenda_items
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const { error } = await supabase
        .from('meetings')
        .insert({
          title: formData.title,
          date: format(formData.date, 'yyyy-MM-dd'),
          time: formData.time,
          agenda_items: agendaArray
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting created successfully",
      });
      
      setFormData({ title: '', date: undefined, time: '', agenda_items: '' });
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create meeting",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date || !formData.time || !editingMeeting) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const agendaArray = formData.agenda_items
        .split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const { error } = await supabase
        .from('meetings')
        .update({
          title: formData.title,
          date: format(formData.date, 'yyyy-MM-dd'),
          time: formData.time,
          agenda_items: agendaArray
        })
        .eq('id', editingMeeting.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Meeting updated successfully",
      });
      
      setFormData({ title: '', date: undefined, time: '', agenda_items: '' });
      setIsEditDialogOpen(false);
      setEditingMeeting(null);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update meeting",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="h-6 w-6" />
          Meetings
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Team standup meeting"
                  required
                />
              </div>
              
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="agenda">Agenda Items (one per line)</Label>
                <Textarea
                  id="agenda"
                  value={formData.agenda_items}
                  onChange={(e) => setFormData(prev => ({ ...prev, agenda_items: e.target.value }))}
                  placeholder="Plan Instagram posts&#10;Review content calendar&#10;Discuss upcoming campaigns"
                  rows={4}
                />
              </div>
              
              <Button type="submit" className="w-full">Create Meeting</Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Meeting</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Team standup meeting"
                  required
                />
              </div>
              
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="edit-agenda">Agenda Items (one per line)</Label>
                <Textarea
                  id="edit-agenda"
                  value={formData.agenda_items}
                  onChange={(e) => setFormData(prev => ({ ...prev, agenda_items: e.target.value }))}
                  placeholder="Plan Instagram posts&#10;Review content calendar&#10;Discuss upcoming campaigns"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingMeeting(null);
                    setFormData({ title: '', date: undefined, time: '', agenda_items: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Update Meeting</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Active ({activeMeetings.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({archivedMeetings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeMeetings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No active meetings. Create your first meeting!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeMeetings.map((meeting) => {
                const isExpanded = expandedMeetings.has(meeting.id);
                return (
                  <Card key={meeting.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">
                              {format(new Date(meeting.date), 'MMM d, yyyy')}
                            </Badge>
                            <Badge variant="outline">{meeting.time}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(meeting)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          {meeting.agenda_items && meeting.agenda_items.length > 0 && (
                            <Collapsible 
                              open={isExpanded}
                              onOpenChange={(open) => toggleMeetingExpansion(meeting.id, open)}
                            >
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                  Agenda ({meeting.agenda_items.length})
                                </Button>
                              </CollapsibleTrigger>
                            </Collapsible>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    {meeting.agenda_items && meeting.agenda_items.length > 0 && (
                      <Collapsible 
                        open={isExpanded}
                        onOpenChange={(open) => toggleMeetingExpansion(meeting.id, open)}
                      >
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-muted-foreground">Agenda Items:</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {meeting.agenda_items.map((item, index) => (
                                  <li key={index} className="text-sm">{item}</li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived">
          {archivedMeetings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No archived meetings yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {archivedMeetings.map((meeting) => {
                const isExpanded = expandedMeetings.has(meeting.id);
                return (
                  <Card key={meeting.id} className="opacity-75">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">
                              {format(new Date(meeting.date), 'MMM d, yyyy')}
                            </Badge>
                            <Badge variant="outline">{meeting.time}</Badge>
                            <Badge variant="secondary">Archived</Badge>
                          </div>
                        </div>
                        {meeting.agenda_items && meeting.agenda_items.length > 0 && (
                          <Collapsible 
                            open={isExpanded}
                            onOpenChange={(open) => toggleMeetingExpansion(meeting.id, open)}
                          >
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                Agenda ({meeting.agenda_items.length})
                              </Button>
                            </CollapsibleTrigger>
                          </Collapsible>
                        )}
                      </div>
                    </CardHeader>
                    {meeting.agenda_items && meeting.agenda_items.length > 0 && (
                      <Collapsible 
                        open={isExpanded}
                        onOpenChange={(open) => toggleMeetingExpansion(meeting.id, open)}
                      >
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-muted-foreground">Agenda Items:</h4>
                              <ul className="list-disc list-inside space-y-1">
                                {meeting.agenda_items.map((item, index) => (
                                  <li key={index} className="text-sm">{item}</li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}