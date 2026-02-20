export interface Due {
  date: string;
  string: string;
  lang: string;
  is_recurring: boolean;
}

export interface Duration {
  amount: number;
  unit: string; // "minute" | "day"
}

export interface Task {
  id: string;
  content: string;
  description: string;
  project_id: string;
  section_id?: string;
  parent_id?: string | null;
  checked: boolean;
  labels: string[];
  priority: number;
  due?: Due | null;
  duration?: Duration | null;
  added_at: string;
  completed_at?: string | null;
  updated_at?: string;
  user_id?: string;

  // Computed fields (not from API)
  isCompleted: boolean;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
  is_shared: boolean;
  is_favorite: boolean;
  is_archived: boolean;
  created_at?: string;
  updated_at?: string;
  view_style?: string;
}

export interface CompletedTask {
  id: string;
  task_id: string;
  content: string;
  project_id: string;
  section_id?: string;
  completed_at: string;
  user_id?: string;
  note_count: number;
}

export interface CreateTaskRequest {
  content: string;
  description?: string;
  project_id?: string;
  due_string?: string;
  priority?: number;
}

export interface UpdateTaskRequest {
  content?: string;
  description?: string;
  project_id?: string;
  due_string?: string;
  priority?: number;
}

export interface PaginatedResponse<T> {
  results: T[];
  next_cursor: string;
}

export interface CompletedTasksResponse {
  items: CompletedTask[];
}
