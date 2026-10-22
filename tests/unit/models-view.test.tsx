// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { ModelsView } from "../../src/views/ModelsView";

afterEach(cleanup);

function rowIds(): string[] {
  return screen
    .getAllByTestId("model-row")
    .map((row) => row.getAttribute("data-model-id") ?? "");
}

function contextValues(): number[] {
  return screen.getAllByTestId("model-row").map((row) => {
    const cells = row.querySelectorAll("td");
    return Number(cells[1]?.textContent?.replaceAll(",", ""));
  });
}

describe("ModelsView", () => {
  it("renders all six sample models and every required column", () => {
    render(<ModelsView />);
    expect(screen.getByTestId("models-table")).toBeTruthy();
    expect(screen.getAllByTestId("model-row")).toHaveLength(6);
    for (const heading of [
      "Name",
      "Vendor",
      "Context window",
      "Tool-calling reliability",
      "Free availability",
      "Requests / day",
      "Price (USD in / out per 1M)",
    ]) {
      expect(
        screen.getByRole("button", { name: heading }),
      ).toBeTruthy();
    }
  });

  it("sorts by every column", () => {
    render(<ModelsView />);
    for (const name of [
      "Name",
      "Vendor",
      "Context window",
      "Tool-calling reliability",
      "Free availability",
      "Requests / day",
      "Price (USD in / out per 1M)",
    ]) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(screen.getAllByTestId("model-row")).toHaveLength(6);
      expect(new Set(rowIds()).size).toBe(6);
    }
  });

  it("sorts context window ascending then descending and reports aria-sort", () => {
    render(<ModelsView />);
    const button = screen.getByRole("button", { name: /context window/i });
    fireEvent.click(button);
    expect(contextValues()).toEqual([
      128000, 200000, 256000, 256000, 1000000, 1000000,
    ]);
    expect(button.closest("th")?.getAttribute("aria-sort")).toBe("ascending");

    fireEvent.click(button);
    expect(contextValues()).toEqual([
      1000000, 1000000, 256000, 256000, 200000, 128000,
    ]);
    expect(button.closest("th")?.getAttribute("aria-sort")).toBe("descending");
  });

  it("filters to free models only", () => {
    render(<ModelsView />);
    fireEvent.click(screen.getByLabelText("Free only"));
    expect(screen.getAllByTestId("model-row")).toHaveLength(5);
    expect(rowIds()).not.toContain("sample-paid-frontier");
    expect(screen.getByText(/showing 5 of 6 models/i)).toBeTruthy();
  });

  it("searches by name or vendor", () => {
    render(<ModelsView />);
    const search = screen.getByLabelText("Search models");
    fireEvent.change(search, { target: { value: "gemini" } });
    expect(rowIds()).toEqual(["gemini-flash"]);

    fireEvent.change(search, { target: { value: "NVIDIA" } });
    expect(rowIds()).toEqual(["nemotron-3-ultra"]);

    fireEvent.change(search, { target: { value: "no-such-model" } });
    expect(screen.queryAllByTestId("model-row")).toHaveLength(0);
    expect(screen.getByText(/no models match/i)).toBeTruthy();
  });

  it("shows the sample-data banner", () => {
    render(<App />);
    expect(screen.getByTestId("sample-data-banner")).toBeTruthy();
    expect(screen.getByTestId("sample-data-banner").textContent).toMatch(
      /sample data/i,
    );
  });
});
