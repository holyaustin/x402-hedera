import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UIMode from "@/app/components/UIMode";

describe("UIMode", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("renders all three product cards with AAPL selected by default", () => {
    render(<UIMode />);
    expect(screen.getByText("Spot Price")).toBeInTheDocument();
    expect(screen.getByText("Bid / Ask Quote")).toBeInTheDocument();
    expect(screen.getByText("AI Insight")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("AAPL");
  });

  it("lets the user pick a different symbol from the dropdown", () => {
    render(<UIMode />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "TSLA" } });
    expect(screen.getByRole("combobox")).toHaveValue("TSLA");
    expect(screen.getAllByRole("button", { name: /Buy for TSLA/ })).toHaveLength(3);
  });

  it("reveals a custom symbol input when 'Custom symbol…' is selected", () => {
    render(<UIMode />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "__custom__" } });
    expect(screen.getByLabelText("Custom ticker symbol")).toBeInTheDocument();
  });

  it("disables Buy until a custom symbol is typed", () => {
    render(<UIMode />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "__custom__" } });
    const buttons = screen.getAllByRole("button", { name: /Buy for/ });
    buttons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it("calls /api/pay with the selected product and symbol, and shows the HashScan link on success", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({
        ok: true,
        data: { symbol: "AAPL", price: 123 },
        paymentStatus: "settled",
        hashscanUrl: "https://hashscan.io/testnet/transaction/abc",
      }),
    });

    render(<UIMode />);
    const [spotPriceButton] = screen.getAllByRole("button", { name: /Buy for AAPL/ });
    fireEvent.click(spotPriceButton);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/pay",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ product: "spot-price", symbol: "AAPL" }),
        }),
      ),
    );

    expect(await screen.findByText(/View transaction on HashScan/)).toBeInTheDocument();
  });

  it("shows an error message when the purchase fails", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      json: async () => ({ ok: false, error: "insufficient balance" }),
    });

    render(<UIMode />);
    const [spotPriceButton] = screen.getAllByRole("button", { name: /Buy for AAPL/ });
    fireEvent.click(spotPriceButton);

    expect(await screen.findByText("insufficient balance")).toBeInTheDocument();
  });
});
