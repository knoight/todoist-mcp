import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { TodoistClientInterface } from "./client.js";
import type { Task, Project, CompletedTask } from "./types.js";
export declare function makeTask(overrides?: Partial<Task>): Task;
export declare function makeProject(overrides?: Partial<Project>): Project;
export declare function makeCompletedTask(overrides?: Partial<CompletedTask>): CompletedTask;
export declare function createMockClient(overrides?: Partial<TodoistClientInterface>): TodoistClientInterface;
export declare function createTestServer(mockOverrides?: Partial<TodoistClientInterface>): Promise<{
    client: Client<{
        method: string;
        params?: {
            [x: string]: unknown;
            _meta?: {
                [x: string]: unknown;
                progressToken?: string | number | undefined;
                "io.modelcontextprotocol/related-task"?: {
                    taskId: string;
                } | undefined;
            } | undefined;
        } | undefined;
    }, {
        method: string;
        params?: {
            [x: string]: unknown;
            _meta?: {
                [x: string]: unknown;
                progressToken?: string | number | undefined;
                "io.modelcontextprotocol/related-task"?: {
                    taskId: string;
                } | undefined;
            } | undefined;
        } | undefined;
    }, {
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
            progressToken?: string | number | undefined;
            "io.modelcontextprotocol/related-task"?: {
                taskId: string;
            } | undefined;
        } | undefined;
    }>;
    server: McpServer;
    mockClient: TodoistClientInterface;
    cleanup: () => Promise<void>;
}>;
export declare function parseToolResponse(result: Awaited<ReturnType<Client["callTool"]>>): unknown;
