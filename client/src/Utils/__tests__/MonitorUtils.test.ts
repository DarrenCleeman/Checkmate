import { describe, it, expect } from "vitest";
import {
	getMonitorPath,
	getStatusPalette,
	getResponseTimeColor,
	getPageSpeedPalette,
	formatUrl,
} from "../MonitorUtils";

describe("MonitorUtils", () => {
	describe("getMonitorPath", () => {
		it("returns 'uptime' for http monitors", () => {
			expect(getMonitorPath("http")).toBe("uptime");
		});

		it("returns 'uptime' for ping monitors", () => {
			expect(getMonitorPath("ping")).toBe("uptime");
		});

		it("returns 'uptime' for port monitors", () => {
			expect(getMonitorPath("port")).toBe("uptime");
		});

		it("returns 'infrastructure' for hardware monitors", () => {
			expect(getMonitorPath("hardware")).toBe("infrastructure");
		});

		it("returns 'pagespeed' for pagespeed monitors", () => {
			expect(getMonitorPath("pagespeed")).toBe("pagespeed");
		});

		it("returns 'uptime' for docker monitors", () => {
			expect(getMonitorPath("docker")).toBe("uptime");
		});
	});

	describe("getStatusPalette", () => {
		it("returns 'success' for 'up' status", () => {
			expect(getStatusPalette("up")).toBe("success");
		});

		it("returns 'error' for 'down' status", () => {
			expect(getStatusPalette("down")).toBe("error");
		});

		it("returns 'error' for 'breached' status", () => {
			expect(getStatusPalette("breached")).toBe("error");
		});

		it("returns 'warning' for other statuses", () => {
			expect(getStatusPalette("pending" as any)).toBe("warning");
		});
	});

	describe("getResponseTimeColor", () => {
		it("returns 'success' for fast response times (< 200ms)", () => {
			expect(getResponseTimeColor(100)).toBe("success");
		});

		it("returns 'warning' for moderate response times (200-299ms)", () => {
			expect(getResponseTimeColor(250)).toBe("warning");
		});

		it("returns 'error' for slow response times (>= 300ms)", () => {
			expect(getResponseTimeColor(500)).toBe("error");
		});

		it("returns 'success' at boundary 0ms", () => {
			expect(getResponseTimeColor(0)).toBe("success");
		});

		it("returns 'warning' at boundary 200ms", () => {
			expect(getResponseTimeColor(200)).toBe("warning");
		});

		it("returns 'error' at boundary 300ms", () => {
			expect(getResponseTimeColor(300)).toBe("error");
		});
	});

	describe("getPageSpeedPalette", () => {
		it("returns 'success' for scores >= 90", () => {
			expect(getPageSpeedPalette(95)).toBe("success");
		});

		it("returns 'warning' for scores 50-89", () => {
			expect(getPageSpeedPalette(75)).toBe("warning");
		});

		it("returns 'error' for scores < 50", () => {
			expect(getPageSpeedPalette(30)).toBe("error");
		});

		it("returns 'success' at boundary 90", () => {
			expect(getPageSpeedPalette(90)).toBe("success");
		});

		it("returns 'warning' at boundary 50", () => {
			expect(getPageSpeedPalette(50)).toBe("warning");
		});
	});

	describe("formatUrl", () => {
		it("strips http:// prefix", () => {
			expect(formatUrl("http://example.com")).toBe("example.com");
		});

		it("strips https:// prefix", () => {
			expect(formatUrl("https://example.com")).toBe("example.com");
		});

		it("truncates long URLs with ellipsis", () => {
			const longUrl = "https://example.com/" + "a".repeat(60);
			const result = formatUrl(longUrl);
			expect(result.length).toBe(56); // 55 chars + ellipsis
			expect(result.endsWith("…")).toBe(true);
		});

		it("respects custom maxLength", () => {
			const result = formatUrl("https://example.com/path", 10);
			expect(result.length).toBe(11); // 10 chars + ellipsis
		});

		it("returns empty string for empty input", () => {
			expect(formatUrl("")).toBe("");
		});
	});
});
