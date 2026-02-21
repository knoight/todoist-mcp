import type { Task, Project, CompletedTask, CreateTaskRequest, UpdateTaskRequest } from "./types.js";
export declare function taskURL(taskID: string): string;
export declare function projectURL(projectID: string): string;
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
export declare class TodoistClient implements TodoistClientInterface {
    private token;
    constructor(token: string);
    private request;
    getTasks(): Promise<Task[]>;
    getTaskByID(taskID: string): Promise<Task>;
    getCompletedTasks(): Promise<CompletedTask[]>;
    getProjects(): Promise<Project[]>;
    createTask(req: CreateTaskRequest): Promise<Task>;
    updateTask(taskID: string, req: UpdateTaskRequest): Promise<void>;
    completeTask(taskID: string): Promise<void>;
    deleteTask(taskID: string): Promise<void>;
}
