export function filterTasks(tasks, ...filters) {
    return tasks.filter((task) => filters.every((f) => f(task)));
}
export function byProject(projectID) {
    return (t) => t.project_id === projectID;
}
export function byLabel(label) {
    return (t) => t.labels.includes(label);
}
export function byPriority(priority) {
    return (t) => t.priority === priority;
}
export function byMinPriority(minPriority) {
    return (t) => t.priority >= minPriority;
}
export function isCompleted() {
    return (t) => t.isCompleted;
}
export function isActive() {
    return (t) => !t.isCompleted;
}
export function createdAfter(time) {
    return (t) => t.createdAt > time;
}
export function createdBefore(time) {
    return (t) => t.createdAt < time;
}
export function dueToday() {
    return (task) => {
        if (!task.due || !task.due.date)
            return false;
        const todayStr = formatDate(new Date());
        return task.due.date === todayStr;
    };
}
export function dueThisWeek() {
    return (task) => {
        if (!task.due || !task.due.date)
            return false;
        const tr = thisWeek();
        const startStr = formatDate(tr.start);
        const endStr = formatDate(tr.end);
        return task.due.date >= startStr && task.due.date < endStr;
    };
}
export function dueNextWeek() {
    return (task) => {
        if (!task.due || !task.due.date)
            return false;
        const tr = nextWeek();
        const startStr = formatDate(tr.start);
        const endStr = formatDate(tr.end);
        return task.due.date >= startStr && task.due.date < endStr;
    };
}
export function overdue() {
    return (task) => {
        if (!task.due || !task.due.date || task.isCompleted)
            return false;
        const todayStr = formatDate(new Date());
        return task.due.date < todayStr;
    };
}
export function containsText(text) {
    const lowerText = text.toLowerCase();
    return (t) => t.content.toLowerCase().includes(lowerText) ||
        t.description.toLowerCase().includes(lowerText);
}
export function hasDuration(maxMinutes) {
    return (t) => {
        // Use the actual duration field from the v1 API
        if (t.duration) {
            let minutes = t.duration.amount;
            if (t.duration.unit === "day") {
                minutes = t.duration.amount * 24 * 60;
            }
            return minutes <= maxMinutes;
        }
        const content = t.content.toLowerCase();
        // Fallback: check labels for duration indicators
        for (const label of t.labels) {
            const lowerLabel = label.toLowerCase();
            if (lowerLabel.includes("quick") ||
                lowerLabel.includes("5min") ||
                lowerLabel.includes("short")) {
                return maxMinutes >= 5;
            }
        }
        // Fallback: check content for quick/short indicators
        if (content.includes("quick") ||
            content.includes("5 min") ||
            content.includes("short task")) {
            return true;
        }
        return false;
    };
}
function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
export function today() {
    const start = startOfDay(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
}
export function yesterday() {
    const now = new Date();
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const start = startOfDay(yesterdayDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
}
export function thisWeek() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    const start = startOfDay(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
}
export function nextWeek() {
    const tw = thisWeek();
    return { start: tw.end, end: new Date(tw.end.getTime() + 7 * 24 * 60 * 60 * 1000) };
}
export function lastWeek() {
    const tw = thisWeek();
    const start = new Date(tw.start);
    start.setDate(start.getDate() - 7);
    return { start, end: tw.start };
}
export function thisMonth() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
}
export function lastMonth() {
    const now = new Date();
    const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { start: firstOfLastMonth, end: firstOfThisMonth };
}
export function thisQuarter() {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const firstMonthOfQuarter = quarter * 3;
    const start = new Date(now.getFullYear(), firstMonthOfQuarter, 1);
    const end = new Date(now.getFullYear(), firstMonthOfQuarter + 3, 1);
    return { start, end };
}
export function createdInRange(tr) {
    return (t) => {
        const created = t.createdAt.getTime();
        // Use >= start (with 1-second tolerance like Go version) and < end
        return created >= tr.start.getTime() - 1000 && created < tr.end.getTime();
    };
}
