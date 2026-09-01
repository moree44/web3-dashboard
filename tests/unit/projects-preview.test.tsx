import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createProject, deleteProject } from "@/features/projects/actions";
import { ProjectsPreview } from "@/features/projects/components/projects-preview";
import { projectsPreviewData } from "@/features/projects/preview-data";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/projects",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/projects/actions", () => ({
  // The real-mode query refetches on mount (staleTime 0). A bare stub is fine:
  // ProjectsPreview falls back to initialData when the query data is undefined.
  getProjectsWorkspaceData: vi.fn(async () => undefined),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  archiveProject: vi.fn(),
  deleteProject: vi.fn(),
  uploadProjectLogo: vi.fn(),
}));

function renderWithQuery(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function renderProjectsPreview(props: { developmentPreview?: boolean } = {}) {
  return renderWithQuery(
    <ProjectsPreview initialData={projectsPreviewData} developmentPreview={props.developmentPreview} />,
  );
}

describe("ProjectsPreview", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("adds a project through the dialog in development preview", async () => {
    renderProjectsPreview({ developmentPreview: true });

    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    expect(screen.getByRole("dialog", { name: "Add project" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Soundness, NexusHQ, Linera..."), { target: { value: "Mint campaign" } });
    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => expect(screen.getAllByText("Mint campaign").length).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add project" })).not.toBeInTheDocument());
  });

  it("optimistically shows a created project before the server responds", async () => {
    const created = {
      ...projectsPreviewData.projects[0],
      id: "created-project",
      name: "Optimistic Alpha",
    };
    let resolveCreate: (value: typeof created) => void = () => {};
    vi.mocked(createProject).mockImplementation(() => new Promise((resolve) => {
      resolveCreate = resolve;
    }));

    renderProjectsPreview();

    fireEvent.click(screen.getByRole("button", { name: "Add project" }));
    fireEvent.change(screen.getByPlaceholderText("Soundness, NexusHQ, Linera..."), { target: { value: "Optimistic Alpha" } });
    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => expect(createProject).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Add project" })).not.toBeInTheDocument());
    expect(screen.getAllByText("Optimistic Alpha").length).toBeGreaterThan(0);

    resolveCreate(created);
    await waitFor(() => expect(screen.getAllByText("Optimistic Alpha").length).toBeGreaterThan(0));
  });

  it("edits a project name through the detail drawer in development preview", async () => {
    renderProjectsPreview({ developmentPreview: true });

    fireEvent.click(screen.getAllByRole("button", { name: /NexusHQ/ })[0]);
    expect(screen.getByRole("dialog", { name: "NexusHQ" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    const name = screen.getByDisplayValue("NexusHQ");
    fireEvent.change(name, { target: { value: "NexusHQ Prover" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(screen.queryByDisplayValue("NexusHQ")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Close project detail" }));
    expect(screen.getAllByText("NexusHQ Prover").length).toBeGreaterThan(0);
  });

  it("shows Watchlist conversion context in the Project drawer", () => {
    const convertedData = {
      ...projectsPreviewData,
      projects: projectsPreviewData.projects.map((project, index) => index === 0 ? {
        ...project,
        chains: ["Cosmos"],
        twitterUrl: "https://x.com/initiaFDN",
        notes: "Interwoven rollups thesis",
      } : project),
    };
    renderWithQuery(
      <ProjectsPreview initialData={convertedData} developmentPreview />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /Soundness/ })[0]);

    expect(screen.getByText("Cosmos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /X.*initiaFDN/ })).toHaveAttribute(
      "href",
      "https://x.com/initiaFDN",
    );
    expect(screen.getByText("Interwoven rollups thesis")).toBeInTheDocument();
  });


  it("offers safe force delete when a project has linked records", async () => {
    const deleteProjectMock = vi.mocked(deleteProject);
    deleteProjectMock
      .mockResolvedValueOnce({
        ok: false,
        error: "Cannot permanently delete this project yet. It is still linked to 1 tasks. Use safe force delete to detach those records and delete only the project.",
      })
      .mockResolvedValueOnce({ ok: true });

    renderProjectsPreview();

    fireEvent.click(screen.getAllByRole("button", { name: /Soundness/ })[0]);
    expect(screen.getByRole("dialog", { name: "Soundness" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Safe force delete" })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Safe force delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm unlink + delete" }));

    await waitFor(() => {
      expect(deleteProjectMock).toHaveBeenLastCalledWith(expect.any(String), { forceUnlink: true });
    });
    await waitFor(() => expect(screen.queryAllByText("Soundness")).toHaveLength(0));
  });

  it("deletes a project after inline confirmation in development preview", async () => {
    renderProjectsPreview({ developmentPreview: true });

    // jsdom renders both the desktop table and the mobile card list, so the
    // project name appears twice before the delete.
    expect(screen.getAllByText("Soundness").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: /Soundness/ })[0]);
    expect(screen.getByRole("dialog", { name: "Soundness" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "More options" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete permanently" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm delete" }));

    await waitFor(() => expect(screen.queryAllByText("Soundness")).toHaveLength(0));
  });
});
