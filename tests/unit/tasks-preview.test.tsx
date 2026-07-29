import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TasksPreview } from "@/features/tasks/components/tasks-preview";
import { createTask } from "@/features/tasks/actions";
import { taskPreviewData } from "@/features/tasks/preview-data";

vi.mock("@/features/tasks/actions", () => ({
  createTask: vi.fn(),
  updateTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  deleteTask: vi.fn(),
}));

describe("TasksPreview", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("quick adds a task with project-account fallback in development preview", async () => {
    render(<TasksPreview initialData={taskPreviewData} developmentPreview />);

    fireEvent.click(screen.getByRole("button", { name: "Quick add" }));
    const input = screen.getByPlaceholderText("Task title, then press Enter...");
    fireEvent.change(input, { target: { value: "Mint campaign NFT" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(screen.getAllByText("Mint campaign NFT").length).toBeGreaterThan(0));
    expect(screen.getByText("Defaults: Todo, Once, Medium, all project accounts.")).toBeInTheDocument();
  });

  it("opens the full Add Task modal and creates a linked Deadline", async () => {
    const created = {
      ...taskPreviewData.tasks[0],
      id: "created-task",
      title: "Mint allowlist NFT",
      startDate: "2026-07-29",
    };
    vi.mocked(createTask).mockResolvedValue(created);
    render(<TasksPreview initialData={taskPreviewData} />);

    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(screen.getByRole("dialog", { name: "Add task" })).toBeInTheDocument();
    expect(screen.getByLabelText("Project")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Mint NFT, run node, submit proof..."), { target: { value: "Mint allowlist NFT" } });
    fireEvent.click(screen.getByRole("button", { name: "Add linked deadline" }));
    fireEvent.click(screen.getByLabelText("Due date"));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));

    await waitFor(() => expect(createTask).toHaveBeenCalledTimes(1));
    expect(vi.mocked(createTask).mock.calls[0][0]).toMatchObject({
      title: "Mint allowlist NFT",
      startDate: expect.any(String),
      deadline: { dueDate: expect.any(String) },
    });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add task" })).not.toBeInTheDocument());
  });

  it("opens the edit drawer and persists a local preview edit", async () => {
    render(<TasksPreview initialData={taskPreviewData} developmentPreview />);

    fireEvent.click(screen.getAllByRole("button", { name: /Submit proof after address generated/ })[0]);
    expect(screen.getByRole("dialog", { name: "Edit task" })).toBeInTheDocument();

    const title = screen.getByDisplayValue("Submit proof after address generated");
    fireEvent.change(title, { target: { value: "Submit final proof" } });
    const url = screen.getByPlaceholderText("test.com or https://test.com");
    fireEvent.change(url, { target: { value: "test.com" } });
    fireEvent.blur(url);
    expect(screen.getByDisplayValue("https://test.com")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Edit task" })).not.toBeInTheDocument());
    expect(screen.getAllByText("Submit final proof").length).toBeGreaterThan(0);
  });

  it("activates advanced filters and Review opens the same edit drawer", () => {
    render(<TasksPreview initialData={taskPreviewData} developmentPreview />);

    fireEvent.click(screen.getByRole("button", { name: "More filters" }));
    expect(screen.getByLabelText("Filter tasks by status")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Recheck1" }));
    expect(screen.getByText("Recheck queue")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByRole("dialog", { name: "Edit task" })).toBeInTheDocument();
  });

  it("closes a nested dropdown before closing the Task drawer", async () => {
    render(<TasksPreview initialData={taskPreviewData} developmentPreview />);
    fireEvent.click(screen.getAllByRole("button", { name: /Submit proof after address generated/ })[0]);

    fireEvent.click(screen.getByLabelText("Status"));
    expect(screen.getByRole("listbox", { name: "Status" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("listbox", { name: "Status" })).not.toBeInTheDocument());
    expect(screen.getByRole("dialog", { name: "Edit task" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Edit task" })).not.toBeInTheDocument();
  });
});
