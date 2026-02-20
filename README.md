# todoist-mcp

MCP server providing Todoist integration with 11 tools for task management.

## Installation

```bash
npm install -g @knoight/todoist-mcp
```

Or run directly:

```bash
npx @knoight/todoist-mcp
```

## Configuration

Set the `TODOIST_TOKEN` environment variable with your [Todoist API token](https://todoist.com/help/articles/find-your-api-token-Jpzx9IIlB).

### Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "todoist": {
      "command": "npx",
      "args": ["@knoight/todoist-mcp"],
      "env": {
        "TODOIST_TOKEN": "your-token-here"
      }
    }
  }
}
```

### mctx.ai

Connect the GitHub repo `github.com/knoight/todoist-mcp` via the [mctx.ai dashboard](https://mctx.ai). The built JS is committed to the repo so no build step is needed.

## Tools

### Basic Tools

| Tool | Description | Input |
|------|-------------|-------|
| `list_tasks` | List tasks with optional filters | `project_id?`, `label?`, `min_priority?`, `active_only?` |
| `get_task` | Get task details by ID | `task_id` |
| `complete_task` | Mark a task as completed | `task_id` |
| `create_task` | Create a new task | `content`, `description?`, `project_id?`, `due_string?`, `priority?` |
| `update_task` | Update an existing task | `task_id`, `content?`, `description?`, `due_string?`, `priority?` |
| `delete_task` | Delete a task | `task_id` |
| `list_projects` | List all projects | — |

### Advanced Tools

| Tool | Description | Input |
|------|-------------|-------|
| `summarize_completed` | Summarize completed tasks by period | `period?` (today, yesterday, this_week, last_week, this_month, last_month, this_quarter) |
| `find_quick_tasks` | Find quick tasks under N minutes | `max_minutes?` (default 5) |
| `get_overdue_tasks` | Get all overdue tasks | — |
| `get_task_stats` | Get task statistics | — |

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
