import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/renderWithProviders";
import { TextInput } from "../TextInput";

describe("TextInput", () => {
	it("renders without crashing", () => {
		renderWithProviders(<TextInput />);
		expect(screen.getByRole("textbox")).toBeInTheDocument();
	});

	it("accepts and displays user input", async () => {
		renderWithProviders(<TextInput />);
		const input = screen.getByRole("textbox");
		await userEvent.type(input, "hello");
		expect(input).toHaveValue("hello");
	});

	it("renders with a field label", () => {
		renderWithProviders(<TextInput fieldLabel="Email" />);
		expect(screen.getByText("Email")).toBeInTheDocument();
	});

	it("shows required indicator when required", () => {
		renderWithProviders(<TextInput fieldLabel="Name" required />);
		expect(screen.getByText("*")).toBeInTheDocument();
	});

	it("renders without field label wrapper when no label provided", () => {
		renderWithProviders(<TextInput placeholder="Enter text" />);
		expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
	});

	it("displays helper text", () => {
		renderWithProviders(<TextInput helperText="Must be valid" />);
		expect(screen.getByText("Must be valid")).toBeInTheDocument();
	});

	it("respects disabled state", () => {
		renderWithProviders(<TextInput disabled />);
		expect(screen.getByRole("textbox")).toBeDisabled();
	});

	it("calls onChange handler", async () => {
		const handleChange = vi.fn();
		renderWithProviders(<TextInput onChange={handleChange} />);
		await userEvent.type(screen.getByRole("textbox"), "a");
		expect(handleChange).toHaveBeenCalled();
	});
});
