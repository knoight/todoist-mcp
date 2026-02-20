import { describe, it, expect } from "vitest";
import type {
  Task,
  Project,
  Due,
  Duration,
  PaginatedResponse,
  CompletedTasksResponse,
} from "./types.js";
import { taskURL, projectURL } from "./client.js";

describe("Task unmarshal v1 API", () => {
  it("parses a full task", () => {
    const raw = `{
      "id": "abc123",
      "content": "Buy groceries",
      "description": "Milk, eggs, bread",
      "project_id": "proj456",
      "section_id": "sec789",
      "parent_id": null,
      "checked": false,
      "labels": ["shopping", "errands"],
      "priority": 2,
      "due": {"date": "2026-02-15", "string": "Feb 15", "lang": "en", "is_recurring": false},
      "duration": {"amount": 30, "unit": "minute"},
      "added_at": "2026-02-10T14:30:00.000000Z",
      "completed_at": null,
      "updated_at": "2026-02-11T10:00:00.000000Z",
      "user_id": "12345"
    }`;

    const task: Task = JSON.parse(raw);

    expect(task.id).toBe("abc123");
    expect(task.content).toBe("Buy groceries");
    expect(task.description).toBe("Milk, eggs, bread");
    expect(task.project_id).toBe("proj456");
    expect(task.checked).toBe(false);
    expect(task.labels).toEqual(["shopping", "errands"]);
    expect(task.priority).toBe(2);
    expect(task.due?.date).toBe("2026-02-15");
    expect(task.duration?.amount).toBe(30);
    expect(task.duration?.unit).toBe("minute");
    expect(task.added_at).toBe("2026-02-10T14:30:00.000000Z");
    expect(task.user_id).toBe("12345");
  });

  it("parses checked=true", () => {
    const raw = `{
      "id": "task1",
      "content": "Done task",
      "project_id": "proj1",
      "checked": true,
      "labels": [],
      "priority": 1,
      "added_at": "2026-01-01T00:00:00.000000Z"
    }`;

    const task: Task = JSON.parse(raw);
    expect(task.checked).toBe(true);
  });
});

describe("Project unmarshal v1 API", () => {
  it("parses a full project", () => {
    const raw = `{
      "id": "proj123",
      "name": "Work",
      "color": "blue",
      "description": "Work tasks",
      "is_shared": true,
      "is_favorite": false,
      "is_archived": false,
      "created_at": "2026-01-01T00:00:00.000000Z",
      "updated_at": "2026-02-01T00:00:00.000000Z",
      "view_style": "list"
    }`;

    const project: Project = JSON.parse(raw);

    expect(project.id).toBe("proj123");
    expect(project.name).toBe("Work");
    expect(project.color).toBe("blue");
    expect(project.is_shared).toBe(true);
    expect(project.is_favorite).toBe(false);
    expect(project.view_style).toBe("list");
  });
});

describe("Paginated response parsing", () => {
  it("parses paginated task response", () => {
    const raw = `{
      "results": [
        {"id": "t1", "content": "Task 1", "project_id": "p1", "checked": false, "labels": [], "priority": 1, "added_at": "2026-01-01T00:00:00Z"},
        {"id": "t2", "content": "Task 2", "project_id": "p1", "checked": true, "labels": [], "priority": 3, "added_at": "2026-01-02T00:00:00Z"}
      ],
      "next_cursor": "abc123"
    }`;

    const paginated: PaginatedResponse<Task> = JSON.parse(raw);

    expect(paginated.results).not.toBeNull();
    expect(paginated.next_cursor).toBe("abc123");
    expect(paginated.results).toHaveLength(2);
    expect(paginated.results[0].id).toBe("t1");
    expect(paginated.results[1].checked).toBe(true);
  });
});

describe("Bare array parsing", () => {
  it("parses bare array of tasks", () => {
    const raw = `[
      {"id": "t1", "content": "Task 1", "project_id": "p1", "checked": false, "labels": [], "priority": 1, "added_at": "2026-01-01T00:00:00Z"}
    ]`;

    // Bare array should NOT parse as paginated response
    const asPaginated = JSON.parse(raw);
    expect(Array.isArray(asPaginated)).toBe(true);

    const tasks: Task[] = JSON.parse(raw);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("t1");
  });
});

describe("URL helpers", () => {
  it("generates task URL", () => {
    expect(taskURL("abc123")).toBe("https://todoist.com/app/task/abc123");
  });

  it("generates project URL", () => {
    expect(projectURL("proj123")).toBe(
      "https://todoist.com/app/project/proj123"
    );
  });
});

describe("Due unmarshal", () => {
  it("parses due object", () => {
    const raw = `{"date": "2026-02-15", "string": "Feb 15", "lang": "en", "is_recurring": true}`;
    const due: Due = JSON.parse(raw);

    expect(due.date).toBe("2026-02-15");
    expect(due.string).toBe("Feb 15");
    expect(due.is_recurring).toBe(true);
  });
});

describe("Duration unmarshal", () => {
  it("parses duration object", () => {
    const raw = `{"amount": 45, "unit": "minute"}`;
    const dur: Duration = JSON.parse(raw);

    expect(dur.amount).toBe(45);
    expect(dur.unit).toBe("minute");
  });
});

describe("Completed tasks unmarshal", () => {
  it("parses completed tasks response", () => {
    const raw = `{
      "items": [
        {
          "id": "9117242989",
          "task_id": "6fGxmr33JqgfHP5r",
          "content": "DS",
          "project_id": "6cfgMV6qr44mjJfr",
          "section_id": "6cfgMX96CXXRrRmr",
          "completed_at": "2026-02-13T19:18:58.000000Z",
          "user_id": "2396910",
          "note_count": 0
        },
        {
          "id": "9117242966",
          "task_id": "6fGxmr3GwcQ2M46r",
          "content": "SR",
          "project_id": "6cfgMV6qr44mjJfr",
          "section_id": "6cfgMX96CXXRrRmr",
          "completed_at": "2026-02-13T19:18:52.000000Z",
          "user_id": "2396910",
          "note_count": 0
        }
      ]
    }`;

    const resp: CompletedTasksResponse = JSON.parse(raw);

    expect(resp.items).toHaveLength(2);
    expect(resp.items[0].id).toBe("9117242989");
    expect(resp.items[0].task_id).toBe("6fGxmr33JqgfHP5r");
    expect(resp.items[0].content).toBe("DS");
    expect(resp.items[0].completed_at).toBe("2026-02-13T19:18:58.000000Z");
    expect(resp.items[0].project_id).toBe("6cfgMV6qr44mjJfr");
  });
});

describe("Task nullable fields", () => {
  it("handles null optional fields", () => {
    const raw = `{
      "id": "t1",
      "content": "Task",
      "project_id": "p1",
      "checked": false,
      "labels": [],
      "priority": 1,
      "added_at": "2026-01-01T00:00:00Z",
      "due": null,
      "duration": null,
      "parent_id": null,
      "completed_at": null,
      "description": ""
    }`;

    const task: Task = JSON.parse(raw);

    expect(task.due).toBeNull();
    expect(task.duration).toBeNull();
  });
});
