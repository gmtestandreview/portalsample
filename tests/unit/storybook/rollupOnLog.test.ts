import { describe, expect, it, vi } from "vitest";

import { onLog } from "../../../.storybook/rollupOnLog";

describe("storybook rollup onLog filter", () => {
  it("suppresses vendor INVALID_ANNOTATION originating in node_modules", () => {
    const handler = vi.fn();

    onLog(
      "warn",
      {
        code: "INVALID_ANNOTATION",
        message:
          "node_modules/@microsoft/applicationinsights-web/dist/es5/... pure annotation",
      },
      handler,
    );

    expect(handler).not.toHaveBeenCalled();
  });

  it("suppresses PLUGIN_TIMINGS regardless of message", () => {
    const handler = vi.fn();

    onLog("info", { code: "PLUGIN_TIMINGS", message: "generate bundle 12ms" }, handler);

    expect(handler).not.toHaveBeenCalled();
  });

  it("forwards a first-party INVALID_ANNOTATION untouched", () => {
    const handler = vi.fn();
    const log = {
      code: "INVALID_ANNOTATION",
      message: "ClientApp/src/instrumentation/AppInsightsService.ts bad annotation",
    };

    onLog("warn", log, handler);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith("warn", log);
  });

  it("forwards an INVALID_ANNOTATION with no message (nullish path)", () => {
    const handler = vi.fn();
    const log = { code: "INVALID_ANNOTATION" };

    onLog("warn", log, handler);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith("warn", log);
  });

  it.each([
    { code: "CIRCULAR_DEPENDENCY", message: "a -> b -> a" },
    { code: "UNRESOLVED_IMPORT", message: "cannot resolve ./missing" },
    { code: "PLUGIN_WARNING", message: "node_modules/some-plugin blew up" },
    { code: "SOURCEMAP_ERROR", message: "node_modules/x missing sourcemap" },
    {},
  ])("forwards other diagnostics untouched: %o", (log) => {
    const handler = vi.fn();

    onLog("warn", log, handler);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith("warn", log);
  });

  it("passes the level through unchanged", () => {
    const handler = vi.fn();
    const log = { code: "PLUGIN_ERROR", message: "boom" };

    onLog("error", log, handler);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith("error", log);
  });
});
