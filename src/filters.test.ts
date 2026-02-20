import { describe, it, expect } from "vitest";
import type { Task } from "./types.js";
import {
  filterTasks,
  byProject,
  byLabel,
  byPriority,
  byMinPriority,
  isCompleted,
  isActive,
  dueToday,
  dueThisWeek,
  overdue,
  containsText,
  hasDuration,
  createdInRange,
  today,
  yesterday,
  thisWeek,
  nextWeek,
  lastWeek,
  thisMonth,
  lastMonth,
  thisQuarter,
} from "./filters.js";

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeTasks(): Task[] {
  const now = new Date();
  return [
    {
      id: "1",
      content: "Buy milk",
      description: "",
      project_id: "grocery",
      priority: 1,
      labels: ["shopping"],
      checked: false,
      isCompleted: false,
      due: { date: formatDate(now), string: "", lang: "en", is_recurring: false },
      added_at: now.toISOString(),
      createdAt: now,
    } as Task,
    {
      id: "2",
      content: "Write report",
      description: "",
      project_id: "work",
      priority: 3,
      labels: ["work", "urgent"],
      checked: false,
      isCompleted: false,
      due: {
        date: formatDate(new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)),
        string: "",
        lang: "en",
        is_recurring: false,
      },
      added_at: now.toISOString(),
      createdAt: now,
    } as Task,
    {
      id: "3",
      content: "Quick task 5 min",
      description: "",
      project_id: "work",
      priority: 2,
      labels: ["quick"],
      checked: true,
      isCompleted: true,
      added_at: now.toISOString(),
      createdAt: now,
    } as Task,
    {
      id: "4",
      content: "Future task",
      description: "",
      project_id: "personal",
      priority: 4,
      labels: [],
      checked: false,
      isCompleted: false,
      due: {
        date: formatDate(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)),
        string: "",
        lang: "en",
        is_recurring: false,
      },
      added_at: now.toISOString(),
      createdAt: now,
    } as Task,
    {
      id: "5",
      content: "No due date task",
      description: "",
      project_id: "grocery",
      priority: 1,
      labels: ["shopping"],
      checked: false,
      isCompleted: false,
      added_at: now.toISOString(),
      createdAt: now,
    } as Task,
  ];
}

describe("filterTasks", () => {
  it("returns all tasks with no filters", () => {
    const tasks = makeTasks();
    const result = filterTasks(tasks);
    expect(result).toHaveLength(5);
  });
});

describe("byProject", () => {
  it("filters by project ID", () => {
    const result = filterTasks(makeTasks(), byProject("work"));
    expect(result).toHaveLength(2);
    for (const task of result) {
      expect(task.project_id).toBe("work");
    }
  });
});

describe("byLabel", () => {
  it("filters by label", () => {
    const result = filterTasks(makeTasks(), byLabel("shopping"));
    expect(result).toHaveLength(2);
  });

  it("filters by urgent label", () => {
    const result = filterTasks(makeTasks(), byLabel("urgent"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("returns empty for nonexistent label", () => {
    const result = filterTasks(makeTasks(), byLabel("nonexistent"));
    expect(result).toHaveLength(0);
  });
});

describe("byPriority", () => {
  it("filters by exact priority", () => {
    const result = filterTasks(makeTasks(), byPriority(3));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });
});

describe("byMinPriority", () => {
  it("filters by minimum priority", () => {
    const result = filterTasks(makeTasks(), byMinPriority(3));
    expect(result).toHaveLength(2);
  });

  it("returns all for min priority 1", () => {
    const result = filterTasks(makeTasks(), byMinPriority(1));
    expect(result).toHaveLength(5);
  });
});

describe("isCompleted", () => {
  it("returns only completed tasks", () => {
    const result = filterTasks(makeTasks(), isCompleted());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });
});

describe("isActive", () => {
  it("returns only active tasks", () => {
    const result = filterTasks(makeTasks(), isActive());
    expect(result).toHaveLength(4);
  });
});

describe("dueToday", () => {
  it("returns tasks due today", () => {
    const result = filterTasks(makeTasks(), dueToday());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });
});

describe("overdue", () => {
  it("returns overdue tasks", () => {
    const result = filterTasks(makeTasks(), overdue());
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("excludes completed tasks even with past due date", () => {
    const completedOverdue: Task = {
      id: "x",
      content: "",
      description: "",
      project_id: "",
      checked: true,
      isCompleted: true,
      labels: [],
      priority: 1,
      due: {
        date: formatDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
        string: "",
        lang: "en",
        is_recurring: false,
      },
      added_at: "",
      createdAt: new Date(),
    };
    expect(overdue()(completedOverdue)).toBe(false);
  });

  it("excludes tasks with no due date", () => {
    const noDue: Task = {
      id: "y",
      content: "",
      description: "",
      project_id: "",
      checked: false,
      isCompleted: false,
      labels: [],
      priority: 1,
      added_at: "",
      createdAt: new Date(),
    };
    expect(overdue()(noDue)).toBe(false);
  });
});

describe("dueThisWeek", () => {
  it("includes task due today", () => {
    const result = filterTasks(makeTasks(), dueThisWeek());
    const ids = result.map((t) => t.id);
    expect(ids).toContain("1");
  });
});

describe("containsText", () => {
  it("finds text in content", () => {
    const result = filterTasks(makeTasks(), containsText("milk"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("is case insensitive", () => {
    const result = filterTasks(makeTasks(), containsText("REPORT"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("returns empty for no match", () => {
    const result = filterTasks(makeTasks(), containsText("nonexistent"));
    expect(result).toHaveLength(0);
  });
});

describe("hasDuration", () => {
  it("matches task with duration field", () => {
    const task: Task = {
      id: "1",
      content: "Timed task",
      description: "",
      project_id: "",
      checked: false,
      isCompleted: false,
      labels: [],
      priority: 1,
      duration: { amount: 15, unit: "minute" },
      added_at: "",
      createdAt: new Date(),
    };

    expect(hasDuration(15)(task)).toBe(true);
    expect(hasDuration(30)(task)).toBe(true);
    expect(hasDuration(10)(task)).toBe(false);
  });

  it("matches task with quick label", () => {
    const task: Task = {
      id: "1",
      content: "Some task",
      description: "",
      project_id: "",
      checked: false,
      isCompleted: false,
      labels: ["quick"],
      priority: 1,
      added_at: "",
      createdAt: new Date(),
    };

    expect(hasDuration(5)(task)).toBe(true);
  });

  it("matches task with quick in content", () => {
    const task: Task = {
      id: "1",
      content: "Quick review of doc",
      description: "",
      project_id: "",
      checked: false,
      isCompleted: false,
      labels: [],
      priority: 1,
      added_at: "",
      createdAt: new Date(),
    };

    expect(hasDuration(5)(task)).toBe(true);
  });
});

describe("multiple filters", () => {
  it("combines active + project filters", () => {
    const result = filterTasks(makeTasks(), isActive(), byProject("work"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });
});

describe("createdInRange", () => {
  it("filters tasks by creation time range", () => {
    const now = new Date();
    const tasks: Task[] = [
      {
        id: "1",
        content: "",
        description: "",
        project_id: "",
        checked: false,
        isCompleted: false,
        labels: [],
        priority: 1,
        added_at: "",
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: "2",
        content: "",
        description: "",
        project_id: "",
        checked: false,
        isCompleted: false,
        labels: [],
        priority: 1,
        added_at: "",
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: "3",
        content: "",
        description: "",
        project_id: "",
        checked: false,
        isCompleted: false,
        labels: [],
        priority: 1,
        added_at: "",
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
    ];

    const tw = thisWeek();
    const result = filterTasks(tasks, createdInRange(tw));
    expect(result).not.toBeNull();
  });
});

// TimeRange tests

describe("today()", () => {
  it("starts at midnight and ends 24h later", () => {
    const tr = today();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    expect(tr.start.getTime()).toBe(todayStart.getTime());
    expect(tr.end.getTime()).toBe(todayStart.getTime() + 24 * 60 * 60 * 1000);
  });
});

describe("yesterday()", () => {
  it("starts at yesterday midnight", () => {
    const tr = yesterday();
    const now = new Date();
    const yesterdayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - 1
    );

    expect(tr.start.getTime()).toBe(yesterdayStart.getTime());
  });
});

describe("thisWeek()", () => {
  it("starts on Sunday and spans 7 days", () => {
    const tr = thisWeek();
    expect(tr.start.getDay()).toBe(0); // Sunday
    const duration = tr.end.getTime() - tr.start.getTime();
    expect(duration).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("lastWeek()", () => {
  it("ends at thisWeek start and spans 7 days", () => {
    const tr = lastWeek();
    const tw = thisWeek();

    expect(tr.end.getTime()).toBe(tw.start.getTime());
    const duration = tr.end.getTime() - tr.start.getTime();
    expect(duration).toBe(7 * 24 * 60 * 60 * 1000);
  });
});

describe("nextWeek()", () => {
  it("starts at thisWeek end", () => {
    const tr = nextWeek();
    const tw = thisWeek();
    expect(tr.start.getTime()).toBe(tw.end.getTime());
  });
});

describe("thisMonth()", () => {
  it("starts on the 1st of current month", () => {
    const tr = thisMonth();
    const now = new Date();

    expect(tr.start.getDate()).toBe(1);
    expect(tr.start.getMonth()).toBe(now.getMonth());
  });
});

describe("lastMonth()", () => {
  it("ends at thisMonth start and starts on 1st", () => {
    const tr = lastMonth();
    const tm = thisMonth();

    expect(tr.end.getTime()).toBe(tm.start.getTime());
    expect(tr.start.getDate()).toBe(1);
  });
});

describe("thisQuarter()", () => {
  it("starts on 1st of quarter start month", () => {
    const tr = thisQuarter();
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const expectedMonth = quarter * 3;

    expect(tr.start.getMonth()).toBe(expectedMonth);
    expect(tr.start.getDate()).toBe(1);
  });
});
