import { describe, it, expect } from "vitest";
import { registerSchema } from "../register";

const validData = {
	firstName: "John",
	lastName: "Doe",
	email: "john@example.com",
	password: "Str0ng!Pass",
	confirm: "Str0ng!Pass",
};

describe("registerSchema", () => {
	it("accepts valid registration data", () => {
		const result = registerSchema.safeParse(validData);
		expect(result.success).toBe(true);
	});

	it("lowercases email", () => {
		const result = registerSchema.safeParse({
			...validData,
			email: "John@Example.COM",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.email).toBe("john@example.com");
		}
	});

	it("trims first and last name", () => {
		const result = registerSchema.safeParse({
			...validData,
			firstName: "  John  ",
			lastName: "  Doe  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.firstName).toBe("John");
			expect(result.data.lastName).toBe("Doe");
		}
	});

	it("rejects empty first name", () => {
		const result = registerSchema.safeParse({ ...validData, firstName: "" });
		expect(result.success).toBe(false);
	});

	it("rejects first name over 50 characters", () => {
		const result = registerSchema.safeParse({
			...validData,
			firstName: "A".repeat(51),
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid email", () => {
		const result = registerSchema.safeParse({ ...validData, email: "not-email" });
		expect(result.success).toBe(false);
	});

	it("rejects password shorter than 8 characters", () => {
		const result = registerSchema.safeParse({
			...validData,
			password: "Ab1!",
			confirm: "Ab1!",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password without uppercase letter", () => {
		const result = registerSchema.safeParse({
			...validData,
			password: "str0ng!pass",
			confirm: "str0ng!pass",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password without lowercase letter", () => {
		const result = registerSchema.safeParse({
			...validData,
			password: "STR0NG!PASS",
			confirm: "STR0NG!PASS",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password without number", () => {
		const result = registerSchema.safeParse({
			...validData,
			password: "Strong!Pass",
			confirm: "Strong!Pass",
		});
		expect(result.success).toBe(false);
	});

	it("rejects password without special character", () => {
		const result = registerSchema.safeParse({
			...validData,
			password: "Str0ngPass1",
			confirm: "Str0ngPass1",
		});
		expect(result.success).toBe(false);
	});

	it("rejects mismatched passwords", () => {
		const result = registerSchema.safeParse({
			...validData,
			confirm: "DifferentPass1!",
		});
		expect(result.success).toBe(false);
	});
});
