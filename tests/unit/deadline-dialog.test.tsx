import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeadlineDialog } from "@/features/deadlines/components/deadline-dialog";

const actionMocks = vi.hoisted(() => ({
  createDeadline: vi.fn(),
  updateDeadline: vi.fn(),
  deleteDeadline: vi.fn(),
}));

vi.mock("@/features/deadlines/actions", () => actionMocks);

const options = {
  projects: [{ id: "11111111-1111-4111-8111-111111111111", name: "Project A" }],
  tasks: [{
    id: "22222222-2222-4222-8222-222222222222",
    title: "Mint NFT",
    projectId: "11111111-1111-4111-8111-111111111111",
    projectName: "Project A",
  }],
};

describe("DeadlineDialog", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    actionMocks.createDeadline.mockResolvedValue({
      id: "33333333-3333-4333-8333-333333333333",
      workspaceId: "44444444-4444-4444-8444-444444444444",
      title: "Mint NFT",
      notes: null,
      url: null,
      dueDate: "2026-08-03",
      dueTime: "20:00:00",
      status: "upcoming",
      linkedProjectId: options.projects[0].id,
      linkedTaskId: options.tasks[0].id,
      linkedProjectName: "Project A",
      linkedTaskTitle: "Mint NFT",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  it("keeps the modal open when Escape closes a nested dropdown", async () => {
    const onClose = vi.fn();
    render(<DeadlineDialog open onClose={onClose} options={options} />);

    fireEvent.click(screen.getByLabelText("Project, optional"));
    expect(screen.getByRole("listbox", { name: "Project, optional" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("creates a deadline with optional Project and Task links", async () => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<DeadlineDialog open onClose={onClose} options={options} onSaved={onSaved} />);

    fireEvent.change(screen.getByPlaceholderText("Mint NFT, cancel billing, renew proxy..."), {
      target: { value: "Mint NFT" },
    });
    fireEvent.click(screen.getByLabelText("Due date"));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    fireEvent.change(screen.getByLabelText("Deadline time in 24-hour format"), {
      target: { value: "20:00" },
    });
    const url = screen.getByPlaceholderText("website.com or https://website.com");
    fireEvent.change(url, { target: { value: "mint.example.com" } });
    fireEvent.blur(url);
    expect(screen.getByDisplayValue("https://mint.example.com")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Project, optional"));
    fireEvent.click(screen.getByRole("option", { name: "Project A" }));
    fireEvent.click(screen.getByLabelText("Related task, optional"));
    fireEvent.click(screen.getByRole("option", { name: /Mint NFT/ }));
    fireEvent.click(screen.getByRole("button", { name: "Create deadline" }));

    await waitFor(() => expect(actionMocks.createDeadline).toHaveBeenCalledTimes(1));
    expect(actionMocks.createDeadline).toHaveBeenCalledWith(expect.objectContaining({
      title: "Mint NFT",
      dueTime: "20:00",
      url: "https://mint.example.com",
      linkedProjectId: options.projects[0].id,
      linkedTaskId: options.tasks[0].id,
    }));
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
