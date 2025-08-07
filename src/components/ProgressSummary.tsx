import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, CheckCircle, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, isBefore } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  time: string;
  is_archived: boolean;
}

interface ProgressSummaryProps {
  actionItems: ActionItem[];
  meetings: Meeting[];
}

export function ProgressSummary({ actionItems, meetings }: ProgressSummaryProps) {
  const completedTasks = actionItems.filter(item => item.status === 'Done').length;
  const totalTasks = actionItems.length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const upcomingMeetings = meetings
    .filter(meeting => !meeting.is_archived && new Date(meeting.date) >= new Date())
    .slice(0, 3);

  const todayTasks = actionItems.filter(item => 
    item.status === 'To Do' && item.due_date && isToday(parseISO(item.due_date))
  );

  const overdueTasks = actionItems.filter(item => 
    item.status === 'To Do' && item.due_date && isBefore(parseISO(item.due_date), new Date())
  );

  // Chart data
  const chartData = {
    labels: ['Tasks'],
    datasets: [
      {
        label: 'Completed',
        data: [completedTasks],
        backgroundColor: 'hsl(159, 57%, 50%)', // secondary color
        borderColor: 'hsl(159, 57%, 40%)',
        borderWidth: 1,
      },
      {
        label: 'Pending',
        data: [pendingTasks],
        backgroundColor: 'hsl(217, 91%, 60%)', // primary color
        borderColor: 'hsl(217, 91%, 50%)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Task Completion Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const urgentDeadlines = actionItems
    .filter(item => {
      if (!item.due_date) return false;
      const dueDate = parseISO(item.due_date);
      return item.status === 'To Do' && (isToday(dueDate) || isTomorrow(dueDate));
    })
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 5);

  const getUrgencyBadge = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isBefore(date, new Date())) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (isToday(date)) {
      return <Badge variant="destructive">Due Today</Badge>;
    }
    if (isTomorrow(date)) {
      return <Badge variant="default">Due Tomorrow</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Progress Summary</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{totalTasks}</div>
            <div className="mt-2">
              <Progress value={completionRate} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completionRate.toFixed(0)}% completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Tasks due today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Tasks past due
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingMeetings.length}</div>
            <p className="text-xs text-muted-foreground">
              Next 3 meetings
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Task Completion Chart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Tasks:</span>
              <span className="font-semibold">{totalTasks}</span>
            </div>
            <div className="flex justify-between">
              <span>Completion Rate:</span>
              <span className="font-semibold">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Upcoming Meetings:</span>
              <span className="font-semibold">{upcomingMeetings.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Urgent Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            {urgentDeadlines.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No urgent deadlines</p>
            ) : (
              <div className="space-y-3">
                {urgentDeadlines.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Assigned to {item.assignee}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">
                        {format(parseISO(item.due_date), 'MMM dd')}
                      </span>
                      {getUrgencyBadge(item.due_date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No upcoming meetings</p>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(meeting.date), 'MMM dd, yyyy')} at {meeting.time}
                      </p>
                    </div>
                    {isToday(new Date(meeting.date)) && (
                      <Badge variant="default">Today</Badge>
                    )}
                    {isTomorrow(new Date(meeting.date)) && (
                      <Badge variant="secondary">Tomorrow</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}