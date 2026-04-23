import { describe, it, expect } from "vitest";
import { loginSchema } from "../login";

describe("loginSchema", () => {
	it("accepts valid email and password", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "password123",
		});
		expect(result.success).toBe(true);
	});

	it("transforms email to lowercase", () => {
		const result = loginSchema.safeParse({
			email: "User@Example.COM",
			password: "password123",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.email).toBe("user@example.com");
		}
	});

	it("rejects invalid email", () => {
		const result = loginSchema.safeParse({
			email: "not-an-email",
			password: "password123",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty email", () => {
		const result = loginSchema.safeParse({
			email: "",
			password: "password123",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty password", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "",
		});
		expect(result.success).toBe(false);
	});
});
