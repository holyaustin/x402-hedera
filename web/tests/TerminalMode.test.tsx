import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TerminalMode from "@/app/components/TerminalMode";

async function typeCommand(user: ReturnType<typeof userEvent.setup>, cmd: string) {
  const input = screen.getByPlaceholderText("buy ai-insight TSLA");
  await user.clear(input);
  await user.type(input, cmd);
  await user.keyboard("{Enter}");
}

describe("TerminalMode", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("shows the welcome line on first render", () => {
    render(<TerminalMode />);
    expect(screen.getByText(/type 'help' to get started/)).toBeInTheDocument();
  });

  it("prints help text for the help command", async () => {
    const user = userEvent.setup();
    render(<TerminalMode />);
    await typeCommand(user, "help");
    expect(await screen.findByText(/Available commands/)).toBeInTheDocument();
  });

  it("prints the catalog for the catalog command", async () => {
    const user = userEvent.setup();
    render(<TerminalMode />);
    await typeCommand(user, "catalog");
    expect(await screen.findByText(/spot-price/)).toBeInTheDocument();
  });

  it("prints the symbol list for the symbols command", async () => {
    const user = userEvent.setup();
    render(<TerminalMode />);
    await typeCommand(user, "symbols");
    expect(await screen.findByText(/HBAR/)).toBeInTheDocument();
  });

  it("reports unknown commands", async () => {
    const user = userEvent.setup();
    render(<TerminalMode />);
    await typeCommand(user, "frobnicate");
    expect(await screen.findByText(/command not found: frobnicate/)).toBeInTheDocument();
  });

  it("clears the screen on 'clear'", async () => {
    const user = userEvent.setup();
    render(<TerminalMode />);
    await typeCommand(user, "help");
    await typeCommand(user, "clear");
    expect(screen.queryByText(/Available commands/)).not.toBeInTheDocument();
  });

  it("runs a buy command against /api/pay and prints the HashScan link", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        data: { symbol: "AAPL" },
        paymentStatus: "settled",
        hashscanUrl: "https://hashscan.io/testnet/transaction/abc",
      }),
    });
    const user = userEvent.setup();
    render(<TerminalMode />);
    await typeCommand(user, "buy spot-price AAPL");
    expect(await screen.findByText(/HashScan: https:\/\/hashscan\.io/)).toBeInTheDocument();
  });

  it("prints an error line when the purchase fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: false, error: "insufficient balance" }),
    });
    const user = userEvent.setup();
    render(<TerminalMode />);
    await typeCommand(user, "buy quote AAPL");
    expect(await screen.findByText(/error: insufficient balance/)).toBeInTheDocument();
  });

  it("inserts a symbol into the input via the quick-insert chips", () => {
    render(<TerminalMode />);
    fireEvent.click(screen.getByRole("button", { name: "TSLA" }));
    const input = screen.getByPlaceholderText("buy ai-insight TSLA") as HTMLInputElement;
    expect(input.value).toContain("TSLA");
  });
});
