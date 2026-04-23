import { describe, it, expect } from "vitest";
import {
	MS_PER_SECOND,
	MS_PER_MINUTE,
	MS_PER_HOUR,
	MS_PER_DAY,
	MS_PER_WEEK,
	tickDateFormatLookup,
	tooltipDateFormatLookup,
	formatTimestamp,
} from "../TimeUtils";

describe("TimeUtils", () => {
	describe("time constants", () => {
		it("defines MS_PER_SECOND as 1000", () => {
			expect(MS_PER_SECOND).toBe(1000);
		});

		it("defines MS_PER_MINUTE as 60 seconds", () => {
			expect(MS_PER_MINUTE).toBe(60 * 1000);
		});

		it("defines MS_PER_HOUR as 60 minutes", () => {
			expect(MS_PER_HOUR).toBe(60 * 60 * 1000);
		});

		it("defines MS_PER_DAY as 24 hours", () => {
			expect(MS_PER_DAY).toBe(24 * 60 * 60 * 1000);
		});

		it("defines MS_PER_WEEK as 7 days", () => {
			expect(MS_PER_WEEK).toBe(7 * 24 * 60 * 60 * 1000);
		});
	});

	describe("tickDateFormatLookup", () => {
		it("returns time format for 'recent'", () => {
			expect(tickDateFormatLookup("recent")).toBe("h:mm A");
		});

		it("returns time format for 'day'", () => {
			expect(tickDateFormatLookup("day")).toBe("h:mm A");
		});

		it("returns date+time format for 'week'", () => {
			expect(tickDateFormatLookup("week")).toBe("MM/D, h:mm A");
		});

		it("returns date format for 'month'", () => {
			expect(tickDateFormatLookup("month")).toBe("ddd. M/D");
		});

		it("returns empty string for unknown range", () => {
			expect(tickDateFormatLookup("year")).toBe("");
		});
	});

	describe("tooltipDateFormatLookup", () => {
		it("returns full date format for 'recent'", () => {
			expect(tooltipDateFormatLookup("recent")).toBe("ddd. MMMM D, YYYY, hh:mm A");
		});

		it("returns full date format for 'week'", () => {
			expect(tooltipDateFormatLookup("week")).toBe("ddd. MMMM D, YYYY, hh:mm A");
		});

		it("returns date-only format for 'month'", () => {
			expect(tooltipDateFormatLookup("month")).toBe("ddd. MMMM D, YYYY");
		});

		it("returns empty string for unknown range", () => {
			expect(tooltipDateFormatLookup("year")).toBe("");
		});
	});

	describe("formatTimestamp", () => {
		it("returns dash for null", () => {
			expect(formatTimestamp(null)).toBe("-");
		});

		it("returns dash for empty string", () => {
			expect(formatTimestamp("")).toBe("-");
		});

		it("formats a valid ISO string", () => {
			const result = formatTimestamp("2024-01-15T12:00:00Z");
			expect(typeof result).toBe("string");
			expect(result).not.toBe("-");
		});

		it("formats a numeric timestamp", () => {
			const result = formatTimestamp(1705320000000);
			expect(typeof result).toBe("string");
			expect(result).not.toBe("-");
		});
	});
});
