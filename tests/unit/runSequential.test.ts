import { describe, expect, it } from "vitest";
import { runSequential } from "@/features/extract/runSequential";

describe("runSequential", () => {
  it("runs tasks one at a time and in order", async () => {
    const order: string[] = [];
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const signal = new AbortController().signal;
    const done = runSequential(
      ["first", "second"],
      async (task) => {
        order.push(`start:${task}`);
        if (task === "first") await gate;
        order.push(`end:${task}`);
      },
      { signal },
    );
    await Promise.resolve();
    expect(order).toEqual(["start:first"]);
    release?.();
    await done;
    expect(order).toEqual(["start:first", "end:first", "start:second", "end:second"]);
  });

  it("does not start a later task after cancellation", async () => {
    const controller = new AbortController();
    const started: string[] = [];
    const result = await runSequential(
      ["one", "two"],
      async (task) => {
        started.push(task);
        controller.abort();
      },
      { signal: controller.signal },
    );
    expect(result).toBe("cancelled");
    expect(started).toEqual(["one"]);
  });
});
