import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { CheckboxInput } from "../Checkbox";

describe("CheckboxInput", () => {
	it("renders without crashing", () => {
		renderWithProviders(<CheckboxInput label="Accept terms" />);
		expect(screen.getByRole("checkbox")).toBeInTheDocument();
	});

	it("sets aria-label from label prop", () => {
		const { container } = renderWithProviders(<CheckboxInput label="Accept terms" />);
		const wrapper = container.querySelector("[aria-label='Accept terms']");
		expect(wrapper).toBeInTheDocument();
	});

	it("is unchecked by default", () => {
		renderWithProviders(<CheckboxInput label="Option" />);
		expect(screen.getByRole("checkbox")).not.toBeChecked();
	});

	it("can be checked by clicking", async () => {
		const handleChange = vi.fn();
		renderWithProviders(<CheckboxInput label="Toggle" onChange={handleChange} />);
		await userEvent.click(screen.getByRole("checkbox"));
		expect(handleChange).toHaveBeenCalledTimes(1);
	});

	it("renders as checked when defaultChecked", () => {
		renderWithProviders(<CheckboxInput label="Checked" defaultChecked />);
		expect(screen.getByRole("checkbox")).toBeChecked();
	});

	it("respects disabled state", () => {
		renderWithProviders(
			<CheckboxInput label="Disabled" disabled />
		);
		const checkbox = screen.getByRole("checkbox");
		expect(checkbox).toBeDisabled();
	});

	it("applies custom sx props", () => {
		renderWithProviders(<CheckboxInput label="Custom" sx={{ padding: 0 }} />);
		expect(screen.getByRole("checkbox")).toBeInTheDocument();
	});
});
