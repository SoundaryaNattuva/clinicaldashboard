import React from "react";
import AddStudy from "../src/pages/AddStudy";
import { vi, describe, beforeEach, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

describe("AddStudy form", () => {
  vi.stubGlobal("fetch", vi.fn());

  beforeEach(() => {
    fetch.mockReset();
  });

  it("renders all required fields", () => {
    render(<AddStudy />);
    expect(screen.getByLabelText("Study ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByText("Phase")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Current Enrollment")).toBeInTheDocument();
    expect(screen.getByLabelText("Enrollment Target")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Planned End Date")).toBeInTheDocument();
  });

  it("shows validation error if required fields are missing", async () => {
    const user = userEvent.setup();
    render(<AddStudy />);
    await user.click(screen.getByRole("button", { name: /submit/i }));
    await waitFor(() => {
      expect(screen.getByText(/please fill out the following required field/i)).toBeInTheDocument();
    });
  });

  it("shows error when start date is after planned end date", async () => {
    const user = userEvent.setup();
    render(<AddStudy />);

    await user.type(screen.getByLabelText("Study ID"), "S001");
    await user.type(screen.getByLabelText("Title"), "Test Study");
    await user.type(screen.getByLabelText("Current Enrollment"), "50");
    await user.type(screen.getByLabelText("Enrollment Target"), "100");
    await user.type(screen.getByLabelText("Start Date"), "2025-12-31");
    await user.type(screen.getByLabelText("Planned End Date"), "2025-01-01");

    // NOTE: For Cloudscape Selects, you may need to adjust these clicks.
    // If these don't work, you might need to mock or use a different query.
    await user.click(screen.getByText("Phase"));
    // Wait for the dropdown to appear, then click the option
    await user.click(screen.getByText("Phase 2"));

    await user.click(screen.getByText("Status"));
    await user.click(screen.getByText("Recruiting"));

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/start date must be before/i)).toBeInTheDocument();
    });
  });

  it("submits valid data and calls fetch", async () => {
    const user = userEvent.setup();
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    render(<AddStudy />);

    await user.type(screen.getByLabelText("Study ID"), "S001");
    await user.type(screen.getByLabelText("Title"), "Test Study");
    await user.type(screen.getByLabelText("Current Enrollment"), "50");
    await user.type(screen.getByLabelText("Enrollment Target"), "100");
    await user.type(screen.getByLabelText("Start Date"), "2025-01-01");
    await user.type(screen.getByLabelText("Planned End Date"), "2025-12-31");

    // NOTE: For Cloudscape Selects, you may need to adjust these clicks.
    await user.click(screen.getByText("Phase"));
    await user.click(screen.getByText("Phase 2"));
    await user.click(screen.getByText("Status"));
    await user.click(screen.getByText("Recruiting"));

    await user.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:8000/studies",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });
  });
});
