const BASE_URL = "https://api.todoist.com/api/v1";
export function taskURL(taskID) {
    return `https://todoist.com/app/task/${taskID}`;
}
export function projectURL(projectID) {
    return `https://todoist.com/app/project/${projectID}`;
}
function populateTaskFields(tasks) {
    for (const task of tasks) {
        task.isCompleted = task.checked;
        task.createdAt = new Date(task.added_at);
    }
}
function stripUndefined(obj) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}
export class TodoistClient {
    token;
    constructor(token) {
        this.token = token;
    }
    async request(method, endpoint, body) {
        const options = {
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
            throw new Error(`API request failed with status ${resp.status}: ${respBody}`);
        }
        return respBody;
    }
    async getTasks() {
        const allTasks = [];
        let cursor = "";
        while (true) {
            const endpoint = cursor ? `/tasks?cursor=${cursor}` : "/tasks";
            const respBody = await this.request("GET", endpoint);
            // Try paginated response format first
            try {
                const paginated = JSON.parse(respBody);
                if (paginated.results) {
                    populateTaskFields(paginated.results);
                    allTasks.push(...paginated.results);
                    if (!paginated.next_cursor)
                        break;
                    cursor = paginated.next_cursor;
                    continue;
                }
            }
            catch {
                // Not paginated format, try bare array
            }
            // Fall back to bare array
            const tasks = JSON.parse(respBody);
            populateTaskFields(tasks);
            allTasks.push(...tasks);
            break;
        }
        return allTasks;
    }
    async getTaskByID(taskID) {
        const respBody = await this.request("GET", `/tasks/${taskID}`);
        const task = JSON.parse(respBody);
        task.isCompleted = task.checked;
        task.createdAt = new Date(task.added_at);
        return task;
    }
    async getCompletedTasks() {
        const respBody = await this.request("GET", "/tasks/completed");
        const resp = JSON.parse(respBody);
        return resp.items;
    }
    async getProjects() {
        const allProjects = [];
        let cursor = "";
        while (true) {
            const endpoint = cursor ? `/projects?cursor=${cursor}` : "/projects";
            const respBody = await this.request("GET", endpoint);
            try {
                const paginated = JSON.parse(respBody);
                if (paginated.results) {
                    allProjects.push(...paginated.results);
                    if (!paginated.next_cursor)
                        break;
                    cursor = paginated.next_cursor;
                    continue;
                }
            }
            catch {
                // Not paginated format
            }
            const projects = JSON.parse(respBody);
            allProjects.push(...projects);
            break;
        }
        return allProjects;
    }
    async createTask(req) {
        const respBody = await this.request("POST", "/tasks", req);
        const task = JSON.parse(respBody);
        task.isCompleted = task.checked;
        task.createdAt = new Date(task.added_at);
        return task;
    }
    async updateTask(taskID, req) {
        await this.request("POST", `/tasks/${taskID}`, stripUndefined(req));
    }
    async completeTask(taskID) {
        await this.request("POST", `/tasks/${taskID}/close`);
    }
    async deleteTask(taskID) {
        await this.request("DELETE", `/tasks/${taskID}`);
    }
}
