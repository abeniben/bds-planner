import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { UpcomingMeetings } from '@/components/UpcomingMeetings';
import { ActionItems } from '@/components/ActionItems';
import { IdeaVotingBoard } from '@/components/IdeaVotingBoard';
import { ProgressSummary } from '@/components/ProgressSummary';
import { Settings } from '@/components/Settings';
import { Footer } from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, CheckSquare, Lightbulb, BarChart3, Settings as SettingsIcon } from 'lucide-react';

const Index = () => {
  const [meetings, setMeetings] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [meetingsRes, actionItemsRes, ideasRes] = await Promise.all([
        supabase.from('meetings').select('*').order('date', { ascending: true }),
        supabase.from('action_items').select('*').order('due_date', { ascending: true }),
        supabase.from('ideas').select('*').order('votes', { ascending: false })
      ]);

      if (meetingsRes.error) throw meetingsRes.error;
      if (actionItemsRes.error) throw actionItemsRes.error;
      if (ideasRes.error) throw ideasRes.error;

      setMeetings(meetingsRes.data);
      setActionItems(actionItemsRes.data);
      setIdeas(ideasRes.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">BDS Planner</h1>
          <p className="text-muted-foreground">Content Creation Team Management Dashboard</p>
        </header>

        <Tabs defaultValue="meetings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Meetings</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Ideas</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meetings">
            <UpcomingMeetings meetings={meetings} onUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="actions">
            <ActionItems actionItems={actionItems} meetings={meetings} onUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="ideas">
            <IdeaVotingBoard ideas={ideas} onUpdate={fetchData} />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressSummary actionItems={actionItems} meetings={meetings} />
          </TabsContent>

          <TabsContent value="settings">
            <Settings onUpdate={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;