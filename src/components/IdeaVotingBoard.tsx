import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Lightbulb, ArrowUp, ArrowDown, ArrowUpDown, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Idea {
  id: string;
  title: string;
  description: string;
  proposer: string;
  votes: number;
  created_at?: string;
}

interface IdeaVote {
  id: string;
  idea_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
}

interface IdeaVotingBoardProps {
  ideas: Idea[];
  onUpdate: () => void;
}

export function IdeaVotingBoard({ ideas, onUpdate }: IdeaVotingBoardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [sortBy, setSortBy] = useState('votes');
  const [userVotes, setUserVotes] = useState<Record<string, IdeaVote[]>>({});
  const [userId] = useState(() => `user_${Math.random().toString(36).substr(2, 9)}`);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    proposer: ''
  });
  const { toast } = useToast();

  // Fetch user votes for ideas
  React.useEffect(() => {
    const fetchUserVotes = async () => {
      if (ideas.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('idea_votes')
          .select('*')
          .eq('user_id', userId)
          .in('idea_id', ideas.map(idea => idea.id));

        if (error) throw error;

        const votesByIdea = data.reduce((acc, vote) => {
          if (!acc[vote.idea_id]) acc[vote.idea_id] = [];
          acc[vote.idea_id].push(vote);
          return acc;
        }, {} as Record<string, IdeaVote[]>);

        setUserVotes(votesByIdea);
      } catch (error) {
        console.error('Error fetching user votes:', error);
      }
    };

    fetchUserVotes();
  }, [ideas, userId]);

  const sortedIdeas = React.useMemo(() => {
    return [...ideas].sort((a, b) => {
      if (sortBy === 'votes') {
        return b.votes - a.votes;
      } else {
        // Sort by newest (using created_at)
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }
    });
  }, [ideas, sortBy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.proposer) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('ideas')
        .insert({
          title: formData.title,
          description: formData.description,
          proposer: formData.proposer
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Idea submitted successfully",
      });
      
      setFormData({ title: '', description: '', proposer: '' });
      setIsDialogOpen(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit idea",
        variant: "destructive",
      });
    }
  };

  const handleVote = async (ideaId: string, voteType: 'upvote' | 'downvote') => {
    try {
      const existingVotes = userVotes[ideaId] || [];
      const existingVote = existingVotes.find(vote => vote.vote_type === voteType);
      
      if (existingVote) {
        toast({
          title: "Already voted",
          description: `You have already ${voteType}d this idea`,
          variant: "destructive",
        });
        return;
      }

      // Add vote to idea_votes table
      const { error: voteError } = await supabase
        .from('idea_votes')
        .insert({
          idea_id: ideaId,
          user_id: userId,
          vote_type: voteType
        });

      if (voteError) throw voteError;

      // Update idea votes count
      const currentIdea = ideas.find(idea => idea.id === ideaId);
      if (!currentIdea) return;

      const voteChange = voteType === 'upvote' ? 1 : -1;
      const { error: updateError } = await supabase
        .from('ideas')
        .update({ votes: currentIdea.votes + voteChange })
        .eq('id', ideaId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `${voteType === 'upvote' ? 'Upvote' : 'Downvote'} added!`,
      });
      
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add vote",
        variant: "destructive",
      });
    }
  };

  const handleDeleteIdea = async () => {
    if (!selectedIdea) return;

    try {
      // Delete all votes for this idea first
      const { error: votesError } = await supabase
        .from('idea_votes')
        .delete()
        .eq('idea_id', selectedIdea.id);

      if (votesError) throw votesError;

      // Delete the idea
      const { error: ideaError } = await supabase
        .from('ideas')
        .delete()
        .eq('id', selectedIdea.id);

      if (ideaError) throw ideaError;

      toast({
        title: "Success",
        description: "Idea deleted successfully",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedIdea(null);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete idea",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Lightbulb className="h-6 w-6" />
          Content Idea Voting Board
        </h2>
        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">Most Votes</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Idea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Submit New Content Idea</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Instagram Reel: Behind the scenes"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Show our team's creative process and daily workflow..."
                  rows={4}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="proposer">Your Name</Label>
                <Input
                  id="proposer"
                  value={formData.proposer}
                  onChange={(e) => setFormData(prev => ({ ...prev, proposer: e.target.value }))}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">Submit Idea</Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {ideas.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No ideas submitted yet. Be the first to share your creative thoughts!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedIdeas.map((idea) => (
            <Card key={idea.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg leading-6">{idea.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ArrowUp className="h-3 w-3" />
                      {idea.votes}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedIdea(idea);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {idea.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    by <span className="font-medium">{idea.proposer}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(idea.id, 'upvote')}
                      disabled={(userVotes[idea.id] || []).some(vote => vote.vote_type === 'upvote')}
                      className="flex items-center gap-1 hover:bg-secondary"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(idea.id, 'downvote')}
                      disabled={(userVotes[idea.id] || []).some(vote => vote.vote_type === 'downvote')}
                      className="flex items-center gap-1 hover:bg-secondary"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Delete idea "{selectedIdea?.title}" by {selectedIdea?.proposer}?
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteIdea}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}