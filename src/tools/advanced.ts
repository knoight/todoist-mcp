import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type TodoistClientInterface, taskURL } from "../client.js";
import type { Task } from "../types.js";
import {
  filterTasks,
  isActive,
  overdue,
  dueToday,
  dueThisWeek,
  hasDuration,
  today,
  yesterday,
  thisWeek,
  lastWeek,
  thisMonth,
  lastMonth,
  thisQuarter,
  type TimeRange,
} from "../filters.js";

function taskToOutput(task: Task) {
  return {
    id: task.id,
    content: task.content,
    description: task.description || undefined,
    project_id: task.project_id,
    priority: task.priority,
    labels: task.labels.length > 0 ? task.labels : undefined,
    due: task.due || undefined,
    duration: task.duration || undefined,
    created_at: task.createdAt.toISOString().replace("T", " ").slice(0, 19),
    url: taskURL(task.id),
  };
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function registerAdvancedTools(
  server: McpServer,
  client: TodoistClientInterface
) {
  server.tool(
    "summarize_completed",
    "Summarize tasks completed in a time period (today, yesterday, this_week, last_week, this_month, last_month, this_quarter)",
    {
      period: z
        .string()
        .optional()
        .describe(
          "Time period: today|yesterday|this_week|last_week|this_month|last_month|this_quarter (default today)"
        ),
    },
    async (args) => {
      const period = args.period || "today";

      const timeRanges: Record<string, () => TimeRange> = {
        today,
        yesterday,
        this_week: thisWeek,
        last_week: lastWeek,
        this_month: thisMonth,
        last_month: lastMonth,
        this_quarter: thisQuarter,
      };

      const rangeFn = timeRanges[period];
      if (!rangeFn) {
        return {
          content: [{ type: "text" as const, text: `Invalid period: ${period}` }],
          isError: true,
        };
      }

      const timeRange = rangeFn();

      const completed = await client.getCompletedTasks();

      // Filter by completion date within the time range
      const filtered = completed.filter((task) => {
        const completedAt = new Date(task.completed_at);
        return completedAt >= timeRange.start && completedAt < timeRange.end;
      });

      // Aggregate by project
      const projectCounts = new Map<string, number>();
      for (const task of filtered) {
        projectCounts.set(
          task.project_id,
          (projectCounts.get(task.project_id) || 0) + 1
        );
      }

      // Get project names
      const projectNames = new Map<string, string>();
      try {
        const projects = await client.getProjects();
        for (const project of projects) {
          projectNames.set(project.id, project.name);
        }
      } catch {
        // warning: failed to get projects for name resolution
      }

      const byProject = Array.from(projectCounts.entries()).map(
        ([projectID, count]) => ({
          project_id: projectID,
          project_name: projectNames.get(projectID) || projectID,
          count,
        })
      );

      const tasks = filtered.map((task) => ({
        id: task.id,
        task_id: task.task_id,
        content: task.content,
        project_id: task.project_id,
        completed_at: task.completed_at,
      }));

      const output = {
        period,
        start_date: formatDate(timeRange.start),
        end_date: formatDate(timeRange.end),
        total_tasks: filtered.length,
        by_project: byProject,
        tasks,
      };

      return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
    }
  );

  server.tool(
    "find_quick_tasks",
    "Find quick tasks (under specified minutes, default 5 minutes)",
    {
      max_minutes: z
        .number()
        .optional()
        .describe("Maximum duration in minutes (default 5)"),
    },
    async (args) => {
      const maxMinutes = args.max_minutes || 5;

      const tasks = await client.getTasks();
      const quick = filterTasks(tasks, isActive(), hasDuration(maxMinutes));

      const output = {
        max_minutes: maxMinutes,
        count: quick.length,
        tasks: quick.map(taskToOutput),
      };

      return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
    }
  );

  server.tool(
    "get_overdue_tasks",
    "Get all overdue tasks",
    {},
    async () => {
      const tasks = await client.getTasks();
      const overdueTasks = filterTasks(tasks, overdue());

      const output = {
        count: overdueTasks.length,
        tasks: overdueTasks.map((task) => {
          let daysOverdue = 0;
          if (task.due?.date) {
            const dueDate = new Date(task.due.date + "T00:00:00");
            daysOverdue = Math.floor(
              (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
          }
          return { ...taskToOutput(task), days_overdue: daysOverdue };
        }),
      };

      return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
    }
  );

  server.tool(
    "get_task_stats",
    "Get overall task statistics (total, active, completed, by priority, etc.)",
    {},
    async () => {
      const tasks = await client.getTasks();

      const priorityCounts: Record<number, number> = {};
      const projectIDs = new Set<string>();
      let overdueCount = 0;
      let dueTodayCount = 0;
      let dueThisWeekCount = 0;

      const overdueFilter = overdue();
      const dueTodayFilter = dueToday();
      const dueThisWeekFilter = dueThisWeek();

      for (const task of tasks) {
        priorityCounts[task.priority] =
          (priorityCounts[task.priority] || 0) + 1;
        projectIDs.add(task.project_id);

        if (overdueFilter(task)) overdueCount++;
        if (dueTodayFilter(task)) dueTodayCount++;
        if (dueThisWeekFilter(task)) dueThisWeekCount++;
      }

      const output = {
        total: tasks.length,
        active: tasks.length,
        overdue: overdueCount,
        due_today: dueTodayCount,
        due_this_week: dueThisWeekCount,
        by_priority: {
          priority_1: priorityCounts[1] || 0,
          priority_2: priorityCounts[2] || 0,
          priority_3: priorityCounts[3] || 0,
          priority_4: priorityCounts[4] || 0,
        },
        projects_count: projectIDs.size,
      };

      return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
    }
  );
}
