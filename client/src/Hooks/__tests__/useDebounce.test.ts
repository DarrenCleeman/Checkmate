import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useDebounce from "../useDebounce";

describe("useDebounce", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns the initial value immediately", () => {
		const { result } = renderHook(() => useDebounce("hello", 500));
		expect(result.current).toBe("hello");
	});

	it("does not update value before delay", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "initial", delay: 500 } }
		);

		rerender({ value: "updated", delay: 500 });
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(result.current).toBe("initial");
	});

	it("updates value after delay", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "initial", delay: 500 } }
		);

		rerender({ value: "updated", delay: 500 });
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(result.current).toBe("updated");
	});

	it("resets timer on rapid value changes", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "first", delay: 500 } }
		);

		rerender({ value: "second", delay: 500 });
		act(() => {
			vi.advanceTimersByTime(300);
		});

		rerender({ value: "third", delay: 500 });
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(result.current).toBe("first");

		act(() => {
			vi.advanceTimersByTime(200);
		});
		expect(result.current).toBe("third");
	});

	it("works with number values", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: 0, delay: 300 } }
		);

		rerender({ value: 42, delay: 300 });
		act(() => {
			vi.advanceTimersByTime(300);
		});
		expect(result.current).toBe(42);
	});

	it("respects different delay values", () => {
		const { result, rerender } = renderHook(
			({ value, delay }) => useDebounce(value, delay),
			{ initialProps: { value: "a", delay: 1000 } }
		);

		rerender({ value: "b", delay: 1000 });
		act(() => {
			vi.advanceTimersByTime(999);
		});
		expect(result.current).toBe("a");

		act(() => {
			vi.advanceTimersByTime(1);
		});
		expect(result.current).toBe("b");
	});
});
