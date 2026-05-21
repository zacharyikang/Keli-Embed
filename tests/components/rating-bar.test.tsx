import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RatingBar } from "@/components/questions/rating-bar";
import type { Rating } from "@/lib/domain";

describe("RatingBar", () => {
  it("renders all 4 rating buttons", () => {
    render(<RatingBar onRate={vi.fn()} />);
    expect(screen.getByText("重来")).toBeDefined();
    expect(screen.getByText("困难")).toBeDefined();
    expect(screen.getByText("良好")).toBeDefined();
    expect(screen.getByText("简单")).toBeDefined();
  });

  it("shows keyboard shortcut hints", () => {
    render(<RatingBar onRate={vi.fn()} />);
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
  });

  it("calls onRate with correct rating", () => {
    const onRate = vi.fn();
    render(<RatingBar onRate={onRate} />);
    fireEvent.click(screen.getByText("良好"));
    expect(onRate).toHaveBeenCalledWith("good" satisfies Rating);
  });

  it("calls onRate for all ratings", () => {
    const onRate = vi.fn();
    render(<RatingBar onRate={onRate} />);

    fireEvent.click(screen.getByText("重来"));
    expect(onRate).toHaveBeenLastCalledWith("again");

    fireEvent.click(screen.getByText("困难"));
    expect(onRate).toHaveBeenLastCalledWith("hard");

    fireEvent.click(screen.getByText("良好"));
    expect(onRate).toHaveBeenLastCalledWith("good");

    fireEvent.click(screen.getByText("简单"));
    expect(onRate).toHaveBeenLastCalledWith("easy");
  });

  it("disables buttons when disabled prop is true", () => {
    render(<RatingBar onRate={vi.fn()} disabled />);
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    }
  });

  it("does not call onRate when disabled", () => {
    const onRate = vi.fn();
    render(<RatingBar onRate={onRate} disabled />);
    fireEvent.click(screen.getByText("良好"));
    expect(onRate).not.toHaveBeenCalled();
  });

  it("buttons are enabled by default", () => {
    render(<RatingBar onRate={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect((btn as HTMLButtonElement).disabled).toBe(false);
    }
  });
});
