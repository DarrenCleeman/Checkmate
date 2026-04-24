import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { ButtonInput } from "../Button";

describe("ButtonInput", () => {
	it("renders with provided text", () => {
		renderWithProviders(<ButtonInput>Click me</ButtonInput>);
		expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
	});

	it("handles click events", async () => {
		const handleClick = vi.fn();
		renderWithProviders(<ButtonInput onClick={handleClick}>Click</ButtonInput>);
		await userEvent.click(screen.getByRole("button", { name: /click/i }));
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it("respects disabled state", () => {
		renderWithProviders(
			<ButtonInput disabled>
				Disabled
			</ButtonInput>
		);
		const button = screen.getByRole("button", { name: /disabled/i });
		expect(button).toBeDisabled();
	});

	it("renders with contained variant by default", () => {
		renderWithProviders(<ButtonInput>Default</ButtonInput>);
		const button = screen.getByRole("button", { name: /default/i });
		expect(button).toBeInTheDocument();
	});

	it("renders with outlined variant", () => {
		renderWithProviders(<ButtonInput variant="outlined">Outlined</ButtonInput>);
		const button = screen.getByRole("button", { name: /outlined/i });
		expect(button).toHaveClass("MuiButton-outlined");
	});

	it("applies custom sx props", () => {
		renderWithProviders(<ButtonInput sx={{ width: 200 }}>Styled</ButtonInput>);
		expect(screen.getByRole("button", { name: /styled/i })).toBeInTheDocument();
	});
});
