import { describe, it, expect, afterEach, vi } from "vitest";
import {
  createTestServer,
  makeTask,
  makeProject,
  parseToolResponse,
} from "../test-helpers.js";

describe("basic tools (behavioral)", () => {
  let cleanup: () => Promise<void>;

  afterEach(async () => {
    if (cleanup) await cleanup();
  });

  it("list_tasks — default returns active tasks", async () => {
    const tasks = [
      makeTask({ id: "1", content: "Active", checked: false, isCompleted: false }),
      makeTask({ id: "2", content: "Done", checked: true, isCompleted: true }),
    ];
    const ctx = await createTestServer({ getTasks: vi.fn().mockResolvedValue(tasks) });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({ name: "list_tasks", arguments: {} });
    const data = parseToolResponse(result) as { count: number; tasks: Array<{ id: string }> };

    expect(data.count).toBe(1);
    expect(data.tasks[0].id).toBe("1");
  });

  it("list_tasks — with project_id filter", async () => {
    const tasks = [
      makeTask({ id: "1", project_id: "proj-a", checked: false, isCompleted: false }),
      makeTask({ id: "2", project_id: "proj-b", checked: false, isCompleted: false }),
    ];
    const ctx = await createTestServer({ getTasks: vi.fn().mockResolvedValue(tasks) });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "list_tasks",
      arguments: { project_id: "proj-a" },
    });
    const data = parseToolResponse(result) as { count: number; tasks: Array<{ id: string }> };

    expect(data.count).toBe(1);
    expect(data.tasks[0].id).toBe("1");
  });

  it("list_tasks — with label filter", async () => {
    const tasks = [
      makeTask({ id: "1", labels: ["urgent"], checked: false, isCompleted: false }),
      makeTask({ id: "2", labels: ["low"], checked: false, isCompleted: false }),
    ];
    const ctx = await createTestServer({ getTasks: vi.fn().mockResolvedValue(tasks) });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "list_tasks",
      arguments: { label: "urgent" },
    });
    const data = parseToolResponse(result) as { count: number; tasks: Array<{ id: string }> };

    expect(data.count).toBe(1);
    expect(data.tasks[0].id).toBe("1");
  });

  it("list_tasks — with min_priority filter", async () => {
    const tasks = [
      makeTask({ id: "1", priority: 4, checked: false, isCompleted: false }),
      makeTask({ id: "2", priority: 1, checked: false, isCompleted: false }),
      makeTask({ id: "3", priority: 3, checked: false, isCompleted: false }),
    ];
    const ctx = await createTestServer({ getTasks: vi.fn().mockResolvedValue(tasks) });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "list_tasks",
      arguments: { min_priority: 3 },
    });
    const data = parseToolResponse(result) as { count: number; tasks: Array<{ id: string }> };

    expect(data.count).toBe(2);
    const ids = data.tasks.map((t) => t.id).sort();
    expect(ids).toEqual(["1", "3"]);
  });

  it("get_task — returns task details", async () => {
    const task = makeTask({ id: "abc-123", content: "Important task", priority: 4 });
    const getTaskByID = vi.fn().mockResolvedValue(task);
    const ctx = await createTestServer({ getTaskByID });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "get_task",
      arguments: { task_id: "abc-123" },
    });
    const data = parseToolResponse(result) as { task: { id: string; content: string } };

    expect(getTaskByID).toHaveBeenCalledWith("abc-123");
    expect(data.task.id).toBe("abc-123");
    expect(data.task.content).toBe("Important task");
  });

  it("complete_task — calls completeTask and returns success", async () => {
    const completeTask = vi.fn().mockResolvedValue(undefined);
    const ctx = await createTestServer({ completeTask });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "complete_task",
      arguments: { task_id: "task-99" },
    });
    const data = parseToolResponse(result) as { success: boolean; message: string };

    expect(completeTask).toHaveBeenCalledWith("task-99");
    expect(data.success).toBe(true);
    expect(data.message).toContain("task-99");
  });

  it("create_task — creates and returns task", async () => {
    const created = makeTask({ id: "new-1", content: "New task", priority: 3 });
    const createTask = vi.fn().mockResolvedValue(created);
    const ctx = await createTestServer({ createTask });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "create_task",
      arguments: {
        content: "New task",
        priority: 3,
        due_string: "tomorrow",
      },
    });
    const data = parseToolResponse(result) as { success: boolean; task: { id: string } };

    expect(createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "New task",
        priority: 3,
        due_string: "tomorrow",
      })
    );
    expect(data.success).toBe(true);
    expect(data.task.id).toBe("new-1");
  });

  it("update_task — calls updateTask with correct args", async () => {
    const updateTask = vi.fn().mockResolvedValue(undefined);
    const ctx = await createTestServer({ updateTask });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "update_task",
      arguments: { task_id: "task-5", content: "Updated content", priority: 2 },
    });
    const data = parseToolResponse(result) as { success: boolean; message: string };

    expect(updateTask).toHaveBeenCalledWith(
      "task-5",
      expect.objectContaining({ content: "Updated content", priority: 2 })
    );
    expect(data.success).toBe(true);
  });

  it("delete_task — calls deleteTask and returns success", async () => {
    const deleteTask = vi.fn().mockResolvedValue(undefined);
    const ctx = await createTestServer({ deleteTask });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({
      name: "delete_task",
      arguments: { task_id: "task-del" },
    });
    const data = parseToolResponse(result) as { success: boolean; message: string };

    expect(deleteTask).toHaveBeenCalledWith("task-del");
    expect(data.success).toBe(true);
  });

  it("list_projects — returns projects with URLs", async () => {
    const projects = [
      makeProject({ id: "p1", name: "Work" }),
      makeProject({ id: "p2", name: "Personal" }),
    ];
    const ctx = await createTestServer({ getProjects: vi.fn().mockResolvedValue(projects) });
    cleanup = ctx.cleanup;

    const result = await ctx.client.callTool({ name: "list_projects", arguments: {} });
    const data = parseToolResponse(result) as {
      count: number;
      projects: Array<{ id: string; name: string; url: string }>;
    };

    expect(data.count).toBe(2);
    expect(data.projects[0].url).toContain("p1");
    expect(data.projects[1].name).toBe("Personal");
  });
});
