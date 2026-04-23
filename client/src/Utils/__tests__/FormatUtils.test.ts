import { describe, it, expect } from "vitest";
import { formatPercentage, formatPercentageFromWhole, getPercentage } from "../FormatUtils";

describe("FormatUtils", () => {
	describe("formatPercentage", () => {
		it("formats a decimal as a percentage string", () => {
			expect(formatPercentage(0.75)).toBe("75.0%");
		});

		it("formats 1 as 100.0%", () => {
			expect(formatPercentage(1)).toBe("100.0%");
		});

		it("formats 0 as 0.0%", () => {
			expect(formatPercentage(0)).toBe("0.0%");
		});

		it("rounds to one decimal place", () => {
			expect(formatPercentage(0.5432)).toBe("54.3%");
		});

		it("returns 0.0% for NaN", () => {
			expect(formatPercentage(NaN)).toBe("0.0%");
		});

		it("returns 0.0% for non-number input", () => {
			expect(formatPercentage("abc" as unknown as number)).toBe("0.0%");
		});
	});

	describe("formatPercentageFromWhole", () => {
		it("converts whole number percentage to formatted string", () => {
			expect(formatPercentageFromWhole(75)).toBe("75.0%");
		});

		it("handles 100", () => {
			expect(formatPercentageFromWhole(100)).toBe("100.0%");
		});

		it("handles 0", () => {
			expect(formatPercentageFromWhole(0)).toBe("0.0%");
		});

		it("rounds fractional whole percentages", () => {
			expect(formatPercentageFromWhole(54.32)).toBe("54.3%");
		});
	});

	describe("getPercentage", () => {
		it("calculates percentage correctly", () => {
			expect(getPercentage(50, 200)).toBe(25);
		});

		it("returns 100 for equal value and total", () => {
			expect(getPercentage(10, 10)).toBe(100);
		});

		it("returns 0 when value is 0", () => {
			expect(getPercentage(0, 100)).toBe(0);
		});

		it("returns 0 when total is 0", () => {
			expect(getPercentage(50, 0)).toBe(0);
		});
	});
});
