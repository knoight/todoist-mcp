import { vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { registerBasicTools } from "./tools/basic.js";
import { registerAdvancedTools } from "./tools/advanced.js";
export function makeTask(overrides = {}) {
    return {
        id: "task-1",
        content: "Test task",
        description: "",
        project_id: "proj-1",
        checked: false,
        labels: [],
        priority: 1,
        due: null,
        duration: null,
        added_at: "2025-01-01T00:00:00Z",
        isCompleted: false,
        createdAt: new Date("2025-01-01T00:00:00Z"),
        ...overrides,
    };
}
export function makeProject(overrides = {}) {
    return {
        id: "proj-1",
        name: "Test Project",
        color: "blue",
        is_shared: false,
        is_favorite: false,
        is_archived: false,
        ...overrides,
    };
}
export function makeCompletedTask(overrides = {}) {
    return {
        id: "completed-1",
        task_id: "task-1",
        content: "Completed task",
        project_id: "proj-1",
        completed_at: new Date().toISOString(),
        note_count: 0,
        ...overrides,
    };
}
export function createMockClient(overrides = {}) {
    return {
        getTasks: vi.fn().mockResolvedValue([makeTask()]),
        getTaskByID: vi.fn().mockResolvedValue(makeTask()),
        getCompletedTasks: vi.fn().mockResolvedValue([]),
        getProjects: vi.fn().mockResolvedValue([makeProject()]),
        createTask: vi.fn().mockResolvedValue(makeTask()),
        updateTask: vi.fn().mockResolvedValue(undefined),
        completeTask: vi.fn().mockResolvedValue(undefined),
        deleteTask: vi.fn().mockResolvedValue(undefined),
        ...overrides,
    };
}
export async function createTestServer(mockOverrides = {}) {
    const server = new McpServer({ name: "test-todoist", version: "0.0.1" });
    const mockClient = createMockClient(mockOverrides);
    registerBasicTools(server, mockClient);
    registerAdvancedTools(server, mockClient);
    const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: "test-client", version: "0.0.1" });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const cleanup = async () => {
        await client.close();
        await server.close();
    };
    return { client, server, mockClient, cleanup };
}
export function parseToolResponse(result) {
    const text = result.content[0]?.text;
    return JSON.parse(text);
}
