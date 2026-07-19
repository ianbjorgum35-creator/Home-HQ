import { Priority, ProjectStatus, TaskStatus } from "@/generated/prisma/enums";

function coerce<T extends string>(values: readonly T[], value: unknown, fallback: T): T {
  return typeof value === "string" && (values as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

const PRIORITY_VALUES = Object.values(Priority);
const PROJECT_STATUS_VALUES = Object.values(ProjectStatus);
const TASK_STATUS_VALUES = Object.values(TaskStatus);

export function asPriority(value: unknown, fallback: Priority = "MEDIUM"): Priority {
  return coerce(PRIORITY_VALUES, value, fallback);
}

export function asProjectStatus(value: unknown, fallback: ProjectStatus = "NOT_STARTED"): ProjectStatus {
  return coerce(PROJECT_STATUS_VALUES, value, fallback);
}

export function asTaskStatus(value: unknown, fallback: TaskStatus = "OPEN"): TaskStatus {
  return coerce(TASK_STATUS_VALUES, value, fallback);
}

export function asOptionalPriority(value: unknown): Priority | undefined {
  return typeof value === "string" && (PRIORITY_VALUES as string[]).includes(value)
    ? (value as Priority)
    : undefined;
}

export function asOptionalTaskStatus(value: unknown): TaskStatus | undefined {
  return typeof value === "string" && (TASK_STATUS_VALUES as string[]).includes(value)
    ? (value as TaskStatus)
    : undefined;
}
