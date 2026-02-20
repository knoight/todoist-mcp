import { z } from "zod";
import { taskURL, projectURL } from "../client.js";
import { filterTasks, isActive, byProject, byLabel, byMinPriority, } from "../filters.js";
function taskToOutput(task) {
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
export function registerBasicTools(server, client) {
    server.tool("list_tasks", "List Todoist tasks with optional filters (project, label, priority, status)", {
        project_id: z.string().optional().describe("Filter by project ID"),
        label: z.string().optional().describe("Filter by label"),
        min_priority: z
            .number()
            .optional()
            .describe("Minimum priority (1-4 where 4 is highest)"),
        active_only: z
            .boolean()
            .optional()
            .describe("Only show active (non-completed) tasks, default true"),
    }, async (args) => {
        const tasks = await client.getTasks();
        const filters = [];
        // Default to active only
        if (args.active_only ||
            (!args.project_id && !args.label && !args.min_priority)) {
            filters.push(isActive());
        }
        if (args.project_id)
            filters.push(byProject(args.project_id));
        if (args.label)
            filters.push(byLabel(args.label));
        if (args.min_priority)
            filters.push(byMinPriority(args.min_priority));
        const filtered = filterTasks(tasks, ...filters);
        const output = {
            count: filtered.length,
            tasks: filtered.map(taskToOutput),
        };
        return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    });
    server.tool("get_task", "Get detailed information about a specific task by ID", {
        task_id: z.string().describe("The task ID"),
    }, async (args) => {
        const task = await client.getTaskByID(args.task_id);
        const output = { task: taskToOutput(task) };
        return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    });
    server.tool("complete_task", "Mark a task as completed", {
        task_id: z.string().describe("The task ID to complete"),
    }, async (args) => {
        await client.completeTask(args.task_id);
        const output = {
            success: true,
            message: `Task ${args.task_id} completed successfully`,
        };
        return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    });
    server.tool("create_task", "Create a new Todoist task with optional description, project, due date, and priority", {
        content: z.string().describe("The task content/title"),
        description: z.string().optional().describe("Optional task description"),
        project_id: z.string().optional().describe("Project ID to add task to"),
        due_string: z
            .string()
            .optional()
            .describe("Due date in natural language (e.g. tomorrow, next Monday, Jan 23)"),
        priority: z
            .number()
            .optional()
            .describe("Priority 1-4 where 4 is highest"),
    }, async (args) => {
        const task = await client.createTask({
            content: args.content,
            description: args.description,
            project_id: args.project_id,
            due_string: args.due_string,
            priority: args.priority,
        });
        const output = { success: true, task: taskToOutput(task) };
        return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    });
    server.tool("update_task", "Update an existing Todoist task (content, description, due date, priority)", {
        task_id: z.string().describe("The task ID to update"),
        content: z.string().optional().describe("New task content/title"),
        description: z
            .string()
            .optional()
            .describe("New task description"),
        due_string: z
            .string()
            .optional()
            .describe("New due date in natural language"),
        priority: z
            .number()
            .optional()
            .describe("New priority 1-4 where 4 is highest"),
    }, async (args) => {
        await client.updateTask(args.task_id, {
            content: args.content,
            description: args.description,
            due_string: args.due_string,
            priority: args.priority,
        });
        const output = {
            success: true,
            message: `Task ${args.task_id} updated successfully`,
        };
        return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    });
    server.tool("delete_task", "Delete a Todoist task by ID", {
        task_id: z.string().describe("The task ID to delete"),
    }, async (args) => {
        await client.deleteTask(args.task_id);
        const output = {
            success: true,
            message: `Task ${args.task_id} deleted successfully`,
        };
        return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    });
    server.tool("list_projects", "List all Todoist projects", {}, async () => {
        const projects = await client.getProjects();
        const output = {
            count: projects.length,
            projects: projects.map((p) => ({
                id: p.id,
                name: p.name,
                color: p.color,
                is_shared: p.is_shared,
                is_favorite: p.is_favorite,
                url: projectURL(p.id),
            })),
        };
        return { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] };
    });
}
