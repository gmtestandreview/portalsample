import DOMPurify from "dompurify";
import { afterEach, describe, expect, it } from "vitest";

describe("DOMPurify security regressions", () => {
  afterEach(() => {
    DOMPurify.removeAllHooks();
  });

  it("neutralizes a detached descendant after an IN_PLACE hook removes its ancestor", () => {
    const root = document.createElement("div");
    root.innerHTML = [
      "<footer>",
      '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onload="globalThis.exploited = true">',
      "</footer>",
      "<div>safe</div>",
    ].join("");
    const detachedImage = root.querySelector("img");

    if (!(detachedImage instanceof HTMLImageElement)) {
      throw new Error("Exploit fixture must contain an image");
    }

    DOMPurify.addHook("uponSanitizeElement", (node) => {
      if (node.nodeName === "FOOTER") {
        (node as Element).remove();
      }
    });

    DOMPurify.sanitize(root, {
      ALLOWED_TAGS: ["div", "#text", "footer"],
      IN_PLACE: true,
    });

    expect(root.innerHTML).toBe("<div>safe</div>");
    expect(detachedImage).not.toHaveAttribute("onload");
  });
});
