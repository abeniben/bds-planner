import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Archive, Trash2, Moon, Sun } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SettingsProps {
  onUpdate: () => void;
}

export function Settings({ onUpdate }: SettingsProps) {
  const { toast } = useToast();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved dark mode preference or default to light mode
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    updateTheme(isDark);
  }, []);

  const updateTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    updateTheme(newDarkMode);
  };

  const archiveAllMeetings = async () => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ is_archived: true })
        .eq('is_archived', false);

      if (error) throw error;

      toast({
        title: "Success",
        description: "All meetings have been archived",
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive meetings",
        variant: "destructive",
      });
    }
  };

  const clearCompletedTasks = async () => {
    try {
      const { error } = await supabase
        .from('action_items')
        .delete()
        .eq('status', 'Done');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Completed tasks have been cleared",
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear completed tasks",
        variant: "destructive",
      });
    }
  };

  const deleteAllArchivedMeetings = async () => {
    try {
      // First, get all archived meeting IDs
      const { data: archivedMeetings, error: fetchError } = await supabase
        .from('meetings')
        .select('id')
        .eq('is_archived', true);

      if (fetchError) throw fetchError;

      if (archivedMeetings && archivedMeetings.length > 0) {
        const meetingIds = archivedMeetings.map(meeting => meeting.id);
        
        // Delete action items related to archived meetings
        const { error: actionItemsError } = await supabase
          .from('action_items')
          .delete()
          .in('meeting_id', meetingIds);

        if (actionItemsError) throw actionItemsError;

        // Delete archived meetings
        const { error: meetingsError } = await supabase
          .from('meetings')
          .delete()
          .eq('is_archived', true);

        if (meetingsError) throw meetingsError;
      }

      toast({
        title: "Success",
        description: "All archived meetings and related action items have been deleted",
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete archived meetings",
        variant: "destructive",
      });
    }
  };

  const clearAllData = async () => {
    try {
      // Delete in correct order due to foreign key constraints
      await supabase.from('action_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('meetings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('ideas').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      toast({
        title: "Success",
        description: "All data has been cleared",
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear all data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Meeting Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Archive all current meetings to clean up your active meetings list.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Archive All Meetings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Archive All Meetings</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive all current meetings. Archived meetings won't appear in the main list 
                    but will remain in the database. This action cannot be undone from the interface.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={archiveAllMeetings}>
                    Archive All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <p className="text-sm text-muted-foreground">
              Permanently delete all archived meetings and their related action items.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Delete All Archived Meetings
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Archived Meetings</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all archived meetings and their related action items. 
                    This action cannot be undone. Are you sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteAllArchivedMeetings}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Archived
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Data Cleanup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Remove all completed tasks from your action items list.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Clear Completed Tasks
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear Completed Tasks</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all tasks marked as "Done". 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={clearCompletedTasks}>
                        Clear Completed
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Reset the entire dashboard by clearing all data.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Clear All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Clear All Data</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete ALL meetings, action items, and ideas. 
                        This action cannot be undone. Are you absolutely sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={clearAllData}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Theme Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-sm font-medium">
                Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Toggle between light and dark themes for better visibility.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About BDS Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            BDS Planner is a comprehensive content creation team management tool designed to help 
            teams coordinate meetings, track action items, brainstorm content ideas, and monitor progress. 
            Built with React, Tailwind CSS, and Supabase for a modern, responsive experience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}