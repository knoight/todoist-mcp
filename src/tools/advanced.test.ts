import { describe, it, expect, afterEach, vi } from "vitest";
import {
  createTestServer,
  makeTask,
  makeProject,
  makeCompletedTask,
  parseToolResponse,
} from "../test-helpers.js";

describe("advanced tools (behavioral)", () => {
  let cleanup: () => Promise<void>;

  afterEach(async () => {
    if (cleanup) await cleanup();
  });

  it("find_quick_tasks — default 5 min", async () => {
    const tasks = [
      makeTask({
        id: "quick-1",
        content: "Quick one",
        duration: { amount: 3, unit: "minute" },
        checked: false,
        isCompleted: false,
      }),
      makeTask({
        id: "long-1",
        content: "Long one",
        duration: { amount: 60, unit: "minute" },
        checked: false,
        isCompleted: false,
      }),
      makeTask({
        id: "no-dur",
        content: "No duration",
        duration: null,
        checked: false,
        isCompleted: false,
      }),
    ];
    const ctx = await createTestServer({ getTasks: vi.fn().mockResolvedValue(tasks) });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({ name: "find_quick_tasks", arguments: {} });
    const data = parseToolResponse(result) as { max_minutes: number; count: number; tasks: Array<{ id: string }> };

    expect(data.max_minutes).toBe(5);
    expect(data.count).toBe(1);
    expect(data.tasks[0].id).toBe("quick-1");
  });

  it("get_overdue_tasks — returns overdue tasks with days_overdue", async () => {
    const tasks = [
      makeTask({
        id: "overdue-1",
        content: "Overdue task",
        checked: false,
        isCompleted: false,
        due: { date: "2020-01-01", string: "long ago", lang: "en", is_recurring: false },
      }),
      makeTask({
        id: "future-1",
        content: "Future task",
        checked: false,
        isCompleted: false,
        due: { date: "2099-12-31", string: "far future", lang: "en", is_recurring: false },
      }),
    ];
    const ctx = await createTestServer({ getTasks: vi.fn().mockResolvedValue(tasks) });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({ name: "get_overdue_tasks", arguments: {} });
    const data = parseToolResponse(result) as {
      count: number;
      tasks: Array<{ id: string; days_overdue: number }>;
    };

    expect(data.count).toBe(1);
    expect(data.tasks[0].id).toBe("overdue-1");
    expect(data.tasks[0].days_overdue).toBeGreaterThan(100);
  });

  it("get_task_stats — returns correct counts", async () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${pad(yesterdayDate.getMonth() + 1)}-${pad(yesterdayDate.getDate())}`;

    const tasks = [
      makeTask({
        id: "1",
        priority: 4,
        project_id: "p1",
        checked: false,
        isCompleted: false,
        due: { date: todayStr, string: "today", lang: "en", is_recurring: false },
      }),
      makeTask({
        id: "2",
        priority: 2,
        project_id: "p2",
        checked: false,
        isCompleted: false,
        due: { date: yesterdayStr, string: "yesterday", lang: "en", is_recurring: false },
      }),
      makeTask({
        id: "3",
        priority: 1,
        project_id: "p1",
        checked: false,
        isCompleted: false,
      }),
    ];
    const ctx = await createTestServer({ getTasks: vi.fn().mockResolvedValue(tasks) });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({ name: "get_task_stats", arguments: {} });
    const data = parseToolResponse(result) as {
      total: number;
      overdue: number;
      due_today: number;
      by_priority: Record<string, number>;
      projects_count: number;
    };

    expect(data.total).toBe(3);
    expect(data.overdue).toBe(1);
    expect(data.due_today).toBe(1);
    expect(data.by_priority.priority_4).toBe(1);
    expect(data.projects_count).toBe(2);
  });

  it("summarize_completed — default today period", async () => {
    const now = new Date();
    const completedTasks = [
      makeCompletedTask({
        id: "c1",
        task_id: "t1",
        content: "Done today",
        project_id: "p1",
        completed_at: now.toISOString(),
      }),
    ];
    const projects = [makeProject({ id: "p1", name: "Work" })];

    const ctx = await createTestServer({
      getCompletedTasks: vi.fn().mockResolvedValue(completedTasks),
      getProjects: vi.fn().mockResolvedValue(projects),
    });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "summarize_completed",
      arguments: {},
    });
    const data = parseToolResponse(result) as {
      period: string;
      total_tasks: number;
      by_project: Array<{ project_name: string; count: number }>;
    };

    expect(data.period).toBe("today");
    expect(data.total_tasks).toBe(1);
    expect(data.by_project[0].project_name).toBe("Work");
  });

  it("summarize_completed — invalid period returns error", async () => {
    const ctx = await createTestServer();
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "summarize_completed",
      arguments: { period: "invalid_period" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ text: string }>)[0].text;
    expect(text).toContain("Invalid period");
  });
});
