// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import App from "../../src/App";
import { CompareView } from "../../src/views/CompareView";
import { RankingsView } from "../../src/views/RankingsView";

afterEach(cleanup);

function rankingIds(): string[] {
  return screen
    .getAllByTestId("ranking-item")
    .map((item) => item.getAttribute("data-model-id") ?? "");
}

function compareIds(): string[] {
  return screen
    .queryAllByTestId("compare-column")
    .map((item) => item.getAttribute("data-model-id") ?? "");
}

describe("RankingsView", () => {
  it("starts in free-only mode and excludes the paid-only sample model", () => {
    render(<RankingsView />);
    expect(screen.getByTestId("mode-toggle")).toBeTruthy();
    expect(
      (screen.getByTestId("mode-option-free-only") as HTMLInputElement).checked,
    ).toBe(true);
    expect(screen.getAllByTestId("ranking-item")).toHaveLength(5);
    expect(rankingIds()).not.toContain("sample-paid-frontier");
  });

  it("re-ranks immediately when the mixed mode is selected", () => {
    render(<RankingsView />);
    fireEvent.click(screen.getByTestId("mode-option-mixed"));

    expect(screen.getAllByTestId("ranking-item")).toHaveLength(6);
    expect(rankingIds()).toContain("sample-paid-frontier");
    expect(screen.getByText(/6 models eligible/i)).toBeTruthy();
  });

  it("shows score, confidence and the three breakdown parts per model", () => {
    render(<RankingsView />);
    const first = screen.getAllByTestId("ranking-item")[0]!;
    expect(first.textContent).toMatch(/confidence \d+%/);
    expect(within(first).getByText("Quality")).toBeTruthy();
    expect(within(first).getByText("Capacity")).toBeTruthy();
    expect(within(first).getByText("Access")).toBeTruthy();
  });

  it("opens a why panel that lists every source's weight and score", () => {
    render(<RankingsView />);
    fireEvent.click(screen.getAllByTestId("ranking-item")[0]!);

    const panel = screen.getByTestId("why-panel");
    expect(within(panel).getByText("Quality")).toBeTruthy();
    expect(within(panel).getByText("Capacity")).toBeTruthy();
    expect(within(panel).getByText("Access")).toBeTruthy();

    const rows = within(panel).getAllByTestId("why-source-row");
    expect(rows).toHaveLength(4);
    for (const row of rows) {
      const cells = row.querySelectorAll("td");
      expect(cells).toHaveLength(2);
      expect(cells[0]?.textContent).toMatch(/^\d+\.\d{3}$/);
      expect(cells[1]?.textContent).toMatch(/^\d+\.\d$|^not scored$/);
    }
    for (const source of [
      "Artificial Analysis",
      "Aider polyglot leaderboard",
      "SWE-bench",
      "LMArena WebDev",
    ]) {
      expect(within(panel).getByText(source)).toBeTruthy();
    }
  });

  it("closes the why panel", () => {
    render(<RankingsView />);
    fireEvent.click(screen.getAllByTestId("ranking-item")[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByTestId("why-panel")).toBeNull();
  });
});

describe("CompareView", () => {
  it("compares two models side by side", () => {
    render(<CompareView />);
    expect(screen.getByTestId("compare-drawer")).toBeTruthy();
    expect(screen.getByText(/select at least two models/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: /Nemotron 3 Ultra/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /DeepSeek V4 Flash/ }));

    expect(compareIds()).toEqual(["nemotron-3-ultra", "deepseek-v4-flash"]);
  });

  it("allows three models and refuses a fourth", () => {
    render(<CompareView />);
    const nemotron = screen.getByRole("checkbox", {
      name: /Nemotron 3 Ultra/,
    }) as HTMLInputElement;
    const deepseek = screen.getByRole("checkbox", {
      name: /DeepSeek V4 Flash/,
    }) as HTMLInputElement;
    const gemini = screen.getByRole("checkbox", {
      name: /Gemini Flash/,
    }) as HTMLInputElement;
    const gpt = screen.getByRole("checkbox", {
      name: /GPT-OSS 120B/,
    }) as HTMLInputElement;

    fireEvent.click(nemotron);
    fireEvent.click(deepseek);
    fireEvent.click(gemini);
    expect(compareIds()).toHaveLength(3);
    expect(gpt.disabled).toBe(true);

    fireEvent.click(gemini);
    expect(compareIds()).toHaveLength(2);
    expect(gpt.disabled).toBe(false);
  });

  it("shows facts and both mode scores for each selected model", () => {
    render(<CompareView />);
    fireEvent.click(screen.getByRole("checkbox", { name: /Sample Paid Model/ }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Gemini Flash/ }));

    const columns = screen.getAllByTestId("compare-column");
    const paid = columns.find(
      (column) => column.getAttribute("data-model-id") === "sample-paid-frontier",
    )!;
    expect(within(paid).getByText("Not eligible in this mode.")).toBeTruthy();
    expect(within(paid).getByText("Free + paid score")).toBeTruthy();
    expect(within(paid).getByText("Quality")).toBeTruthy();
  });
});

describe("App navigation", () => {
  it("switches between the Models, Rankings and Compare views", () => {
    render(<App />);
    expect(screen.getByTestId("models-table")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Rankings" }));
    expect(screen.getByTestId("rankings-list")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Compare" }));
    expect(screen.getByTestId("compare-drawer")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Models" }));
    expect(screen.getByTestId("models-table")).toBeTruthy();
  });
});
