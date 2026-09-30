import { describe, it, expect, vi, afterEach } from "vitest";
import { scrollToTop } from "@/helpers/scrollToTop";

describe("scrollToTop", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrolls the window to the top with a smooth animation", () => {
    const scrollToSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});

    scrollToTop();

    expect(scrollToSpy).toHaveBeenCalledTimes(1);
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});
