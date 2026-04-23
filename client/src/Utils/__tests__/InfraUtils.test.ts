import { describe, it, expect } from "vitest";
import { getFrequency, getCores, getAvgTemp, getOsAndPlatform } from "../InfraUtils";

describe("InfraUtils", () => {
	describe("getFrequency", () => {
		it("converts MHz to GHz string", () => {
			expect(getFrequency(3500)).toBe("3.50 GHz");
		});

		it("handles low frequency", () => {
			expect(getFrequency(800)).toBe("0.80 GHz");
		});

		it("returns N/A for undefined", () => {
			expect(getFrequency(undefined)).toBe("N/A");
		});

		it("returns N/A for 0", () => {
			expect(getFrequency(0)).toBe("N/A");
		});
	});

	describe("getCores", () => {
		it("returns singular for 1 core", () => {
			expect(getCores(1)).toBe("1 core");
		});

		it("returns plural for multiple cores", () => {
			expect(getCores(8)).toBe("8 cores");
		});

		it("returns N/A for undefined", () => {
			expect(getCores(undefined)).toBe("N/A");
		});

		it("returns N/A for 0", () => {
			expect(getCores(0)).toBe("N/A");
		});
	});

	describe("getAvgTemp", () => {
		it("calculates average temperature", () => {
			expect(getAvgTemp([40, 50, 60])).toBe("50.00 °C");
		});

		it("handles single temperature", () => {
			expect(getAvgTemp([72.5])).toBe("72.50 °C");
		});

		it("returns N/A for empty array", () => {
			expect(getAvgTemp([])).toBe("N/A");
		});

		it("returns N/A for null/undefined", () => {
			expect(getAvgTemp(null as unknown as number[])).toBe("N/A");
		});
	});

	describe("getOsAndPlatform", () => {
		it("returns formatted OS and platform", () => {
			const hostInfo = { pretty_name: "Ubuntu 22.04", os: "linux", platform: "x86_64" };
			expect(getOsAndPlatform(hostInfo as any)).toBe("Ubuntu 22.04 (x86_64)");
		});

		it("falls back to os field when pretty_name is missing", () => {
			const hostInfo = { os: "linux", platform: "arm64" };
			expect(getOsAndPlatform(hostInfo as any)).toBe("linux (arm64)");
		});

		it("returns N/A for undefined", () => {
			expect(getOsAndPlatform(undefined)).toBe("N/A");
		});
	});
});
