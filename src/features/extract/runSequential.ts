/**
 * Runs tasks one at a time. A single abort stops the current task's signal
 * (the same signal) and prevents later tasks from starting.
 */
export async function runSequential<T>(
  tasks: readonly T[],
  run: (task: T) => Promise<void>,
  options: { signal: AbortSignal },
): Promise<"completed" | "cancelled"> {
  for (const task of tasks) {
    if (options.signal.aborted) return "cancelled";
    await run(task);
    if (options.signal.aborted) return "cancelled";
  }
  return "completed";
}
