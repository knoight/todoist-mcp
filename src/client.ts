import type {
  Task,
  Project,
  CompletedTask,
  CreateTaskRequest,
  UpdateTaskRequest,
  PaginatedResponse,
  CompletedTasksResponse,
} from "./types.js";

const BASE_URL = "https://api.todoist.com/api/v1";

export function taskURL(taskID: string): string {
  return `https://todoist.com/app/task/${taskID}`;
}

export function projectURL(projectID: string): string {
  return `https://todoist.com/app/project/${projectID}`;
}

function populateTaskFields(tasks: Task[]): void {
  for (const task of tasks) {
    task.isCompleted = task.checked;
    task.createdAt = new Date(task.added_at);
  }
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export interface TodoistClientInterface {
  getTasks(): Promise<Task[]>;
  getTaskByID(taskID: string): Promise<Task>;
  getCompletedTasks(): Promise<CompletedTask[]>;
  getProjects(): Promise<Project[]>;
  createTask(req: CreateTaskRequest): Promise<Task>;
  updateTask(taskID: string, req: UpdateTaskRequest): Promise<void>;
  completeTask(taskID: string): Promise<void>;
  deleteTask(taskID: string): Promise<void>;
}

export class TodoistClient implements TodoistClientInterface {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<string> {
    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30000),
    };

    if (body !== undefined) {
      options.body = JSON.stringify(body);
    }

    const resp = await fetch(`${BASE_URL}${endpoint}`, options);

    const respBody = await resp.text();

    if (resp.status >= 400) {
      throw new Error(
        `API request failed with status ${resp.status}: ${respBody}`
      );
    }

    return respBody;
  }

  async getTasks(): Promise<Task[]> {
    const allTasks: Task[] = [];
    let cursor = "";

    while (true) {
      const endpoint = cursor ? `/tasks?cursor=${cursor}` : "/tasks";
      const respBody = await this.request("GET", endpoint);

      // Try paginated response format first
      try {
        const paginated: PaginatedResponse<Task> = JSON.parse(respBody);
        if (paginated.results) {
          populateTaskFields(paginated.results);
          allTasks.push(...paginated.results);

          if (!paginated.next_cursor) break;
          cursor = paginated.next_cursor;
          continue;
        }
      } catch {
        // Not paginated format, try bare array
      }

      // Fall back to bare array
      const tasks: Task[] = JSON.parse(respBody);
      populateTaskFields(tasks);
      allTasks.push(...tasks);
      break;
    }

    return allTasks;
  }

  async getTaskByID(taskID: string): Promise<Task> {
    const respBody = await this.request("GET", `/tasks/${taskID}`);
    const task: Task = JSON.parse(respBody);
    task.isCompleted = task.checked;
    task.createdAt = new Date(task.added_at);
    return task;
  }

  async getCompletedTasks(): Promise<CompletedTask[]> {
    const respBody = await this.request("GET", "/tasks/completed");
    const resp: CompletedTasksResponse = JSON.parse(respBody);
    return resp.items;
  }

  async getProjects(): Promise<Project[]> {
    const allProjects: Project[] = [];
    let cursor = "";

    while (true) {
      const endpoint = cursor ? `/projects?cursor=${cursor}` : "/projects";
      const respBody = await this.request("GET", endpoint);

      try {
        const paginated: PaginatedResponse<Project> = JSON.parse(respBody);
        if (paginated.results) {
          allProjects.push(...paginated.results);

          if (!paginated.next_cursor) break;
          cursor = paginated.next_cursor;
          continue;
        }
      } catch {
        // Not paginated format
      }

      const projects: Project[] = JSON.parse(respBody);
      allProjects.push(...projects);
      break;
    }

    return allProjects;
  }

  async createTask(req: CreateTaskRequest): Promise<Task> {
    const respBody = await this.request("POST", "/tasks", req);
    const task: Task = JSON.parse(respBody);
    task.isCompleted = task.checked;
    task.createdAt = new Date(task.added_at);
    return task;
  }

  async updateTask(taskID: string, req: UpdateTaskRequest): Promise<void> {
    await this.request("POST", `/tasks/${taskID}`, stripUndefined(req as unknown as Record<string, unknown>));
  }

  async completeTask(taskID: string): Promise<void> {
    await this.request("POST", `/tasks/${taskID}/close`);
  }

  async deleteTask(taskID: string): Promise<void> {
    await this.request("DELETE", `/tasks/${taskID}`);
  }
}
