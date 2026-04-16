import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { IncidentService } from "../src/service/business/incidentService.ts";
import type { MonitorActionDecision } from "../src/service/infrastructure/SuperSimpleQueue/SuperSimpleQueueHelper.ts";
import type { Incident } from "../src/types/incident.ts";
import type { Monitor } from "../src/types/monitor.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const createLogger = () => ({
	info: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
});

const createMockIncidentsRepository = () => ({
	create: jest.fn<(incident: Partial<Incident>) => Promise<Incident>>(),
	findById: jest.fn<(id: string, teamId: string) => Promise<Incident>>(),
	findActiveByIncidentId: jest.fn<(id: string, teamId: string) => Promise<Incident | null>>(),
	findActiveByMonitorId: jest.fn<(monitorId: string, teamId: string) => Promise<Incident | null>>(),
	findByTeamId: jest.fn<() => Promise<Incident[]>>(),
	findSummaryByTeamId: jest.fn(),
	countByTeamId: jest.fn<() => Promise<number>>(),
	updateById: jest.fn<(id: string, teamId: string, patch: Partial<Incident>) => Promise<Incident>>(),
	deleteByMonitorId: jest.fn<() => Promise<number>>(),
	deleteByMonitorIdsNotIn: jest.fn<() => Promise<number>>(),
});

const createMockMonitorsRepository = () => ({
	findById: jest.fn(),
});

const createMockUsersRepository = () => ({
	findById: jest.fn(),
});

const createMockNotificationMessageBuilder = () => ({
	buildMessage: jest.fn(),
	extractThresholdBreaches: jest.fn().mockReturnValue([]),
});

const makeMonitor = (overrides?: Partial<Monitor>): Monitor =>
	({
		id: "monitor1",
		teamId: "team1",
		name: "Test Monitor",
		status: "down",
		...overrides,
	}) as Monitor;

const makeDecision = (overrides?: Partial<MonitorActionDecision>): MonitorActionDecision => ({
	shouldCreateIncident: false,
	shouldResolveIncident: false,
	shouldSendNotification: false,
	incidentReason: null,
	notificationReason: null,
	...overrides,
});

const makeIncident = (overrides?: Partial<Incident>): Incident => ({
	id: "incident1",
	monitorId: "monitor1",
	teamId: "team1",
	startTime: "2025-04-10T12:00:00.000Z",
	endTime: null,
	status: true,
	resolutionType: null,
	resolvedBy: null,
	resolvedByEmail: null,
	comment: null,
	createdAt: "2025-04-10T12:00:00.000Z",
	updatedAt: "2025-04-10T12:00:00.000Z",
	statusCode: 500,
	message: null,
	...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("IncidentService", () => {
	let incidentsRepo: ReturnType<typeof createMockIncidentsRepository>;
	let service: IncidentService;

	beforeEach(() => {
		incidentsRepo = createMockIncidentsRepository();
		service = new IncidentService(
			createLogger() as any,
			incidentsRepo as any,
			createMockMonitorsRepository() as any,
			createMockUsersRepository() as any,
			createMockNotificationMessageBuilder() as any
		);
	});

	// -----------------------------------------------------------------------
	// handleIncident
	// -----------------------------------------------------------------------
	describe("handleIncident", () => {
		it("returns null when neither create nor resolve flag is set", async () => {
			const result = await service.handleIncident(makeMonitor(), 200, makeDecision());
			expect(result).toBeNull();
			expect(incidentsRepo.findActiveByMonitorId).not.toHaveBeenCalled();
		});

		it("creates a new incident on first failure", async () => {
			const created = makeIncident();
			incidentsRepo.findActiveByMonitorId.mockResolvedValue(null);
			incidentsRepo.create.mockResolvedValue(created);

			const decision = makeDecision({
				shouldCreateIncident: true,
				incidentReason: "status_down",
			});

			const result = await service.handleIncident(makeMonitor(), 500, decision);

			expect(incidentsRepo.findActiveByMonitorId).toHaveBeenCalledWith("monitor1", "team1");
			expect(incidentsRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					monitorId: "monitor1",
					teamId: "team1",
					status: true,
					statusCode: 500,
				})
			);
			expect(result).toEqual(created);
		});

		it("uses ISO date string for startTime on creation", async () => {
			incidentsRepo.findActiveByMonitorId.mockResolvedValue(null);
			incidentsRepo.create.mockResolvedValue(makeIncident());

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
			await service.handleIncident(makeMonitor(), 500, decision);

			const createArg = incidentsRepo.create.mock.calls[0][0] as Partial<Incident>;
			// Verify startTime is a valid ISO string (not a numeric timestamp)
			expect(createArg.startTime).toBeDefined();
			expect(new Date(createArg.startTime!).toISOString()).toBe(createArg.startTime);
		});

		it("returns existing active incident without creating a duplicate", async () => {
			const existing = makeIncident();
			incidentsRepo.findActiveByMonitorId.mockResolvedValue(existing);

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
			const result = await service.handleIncident(makeMonitor(), 500, decision);

			expect(result).toEqual(existing);
			expect(incidentsRepo.create).not.toHaveBeenCalled();
		});

		it("resolves active incident when monitor recovers", async () => {
			const active = makeIncident();
			const resolved = makeIncident({ status: false, endTime: "2025-04-10T13:00:00.000Z", resolutionType: "automatic" });
			incidentsRepo.findActiveByMonitorId.mockResolvedValue(active);
			incidentsRepo.updateById.mockResolvedValue(resolved);

			const decision = makeDecision({ shouldResolveIncident: true });
			const result = await service.handleIncident(makeMonitor({ status: "up" } as any), 200, decision);

			expect(incidentsRepo.updateById).toHaveBeenCalledWith(
				"incident1",
				"team1",
				expect.objectContaining({
					status: false,
					resolutionType: "automatic",
				})
			);
			// Verify endTime is set and is a valid ISO string
			const updateArg = incidentsRepo.updateById.mock.calls[0][2] as Partial<Incident>;
			expect(updateArg.endTime).toBeDefined();
			expect(new Date(updateArg.endTime!).toISOString()).toBe(updateArg.endTime);
			expect(result).toEqual(resolved);
		});

		it("returns null when resolving but no active incident exists", async () => {
			incidentsRepo.findActiveByMonitorId.mockResolvedValue(null);

			const decision = makeDecision({ shouldResolveIncident: true });
			const result = await service.handleIncident(makeMonitor({ status: "up" } as any), 200, decision);

			expect(result).toBeNull();
			expect(incidentsRepo.updateById).not.toHaveBeenCalled();
		});

		it("creates a new incident after a previous one was resolved (re-failure)", async () => {
			// No active incident (previous one was resolved)
			incidentsRepo.findActiveByMonitorId.mockResolvedValue(null);
			const newIncident = makeIncident({ id: "incident2" });
			incidentsRepo.create.mockResolvedValue(newIncident);

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
			const result = await service.handleIncident(makeMonitor(), 500, decision);

			expect(incidentsRepo.create).toHaveBeenCalled();
			expect(result).toEqual(newIncident);
		});

		it("creates threshold breach incident with statusCode 9999 and descriptive message", async () => {
			incidentsRepo.findActiveByMonitorId.mockResolvedValue(null);
			incidentsRepo.create.mockResolvedValue(makeIncident({ statusCode: 9999, message: "CPU: 95% (threshold: 80%)" }));

			const decision = makeDecision({
				shouldCreateIncident: true,
				incidentReason: "threshold_breach",
			});

			await service.handleIncident(makeMonitor(), 200, decision);

			expect(incidentsRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					statusCode: 9999,
				})
			);
		});

		it("handles race condition: falls back to existing incident on duplicate key error", async () => {
			const existing = makeIncident();
			incidentsRepo.findActiveByMonitorId
				.mockResolvedValueOnce(null) // First check: no active incident
				.mockResolvedValueOnce(existing); // Fallback after duplicate key error

			const duplicateKeyError = new Error("E11000 duplicate key error");
			(duplicateKeyError as any).code = 11000;
			incidentsRepo.create.mockRejectedValue(duplicateKeyError);

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
			const result = await service.handleIncident(makeMonitor(), 500, decision);

			expect(incidentsRepo.create).toHaveBeenCalled();
			expect(incidentsRepo.findActiveByMonitorId).toHaveBeenCalledTimes(2);
			expect(result).toEqual(existing);
		});

		it("rethrows non-duplicate-key errors from create", async () => {
			incidentsRepo.findActiveByMonitorId.mockResolvedValue(null);
			incidentsRepo.create.mockRejectedValue(new Error("Connection failed"));

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });

			await expect(service.handleIncident(makeMonitor(), 500, decision)).rejects.toThrow("Connection failed");
		});
	});

	// -----------------------------------------------------------------------
	// resolveIncident
	// -----------------------------------------------------------------------
	describe("resolveIncident", () => {
		it("manually resolves an active incident", async () => {
			const active = makeIncident();
			const resolved = makeIncident({
				status: false,
				endTime: "2025-04-10T13:00:00.000Z",
				resolutionType: "manual",
				resolvedBy: "user1",
			});
			incidentsRepo.findActiveByIncidentId.mockResolvedValue(active);
			incidentsRepo.updateById.mockResolvedValue(resolved);

			const result = await service.resolveIncident("incident1", "user1", "team1", "Fixed it", "user@test.com");

			expect(incidentsRepo.updateById).toHaveBeenCalledWith(
				"incident1",
				"team1",
				expect.objectContaining({
					status: false,
					resolutionType: "manual",
					resolvedBy: "user1",
					resolvedByEmail: "user@test.com",
					comment: "Fixed it",
				})
			);
			expect(result).toEqual(resolved);
		});

		it("throws when incident is not found", async () => {
			incidentsRepo.findActiveByIncidentId.mockResolvedValue(null);
			await expect(service.resolveIncident("bad-id", "user1", "team1")).rejects.toThrow("Incident not found");
		});

		it("throws when incident is already resolved", async () => {
			const resolved = makeIncident({ status: false });
			incidentsRepo.findActiveByIncidentId.mockResolvedValue(resolved);
			await expect(service.resolveIncident("incident1", "user1", "team1")).rejects.toThrow("already resolved");
		});

		it("uses ISO date string for endTime on manual resolve", async () => {
			const active = makeIncident();
			incidentsRepo.findActiveByIncidentId.mockResolvedValue(active);
			incidentsRepo.updateById.mockImplementation(async (_id, _teamId, patch) => patch as Incident);

			await service.resolveIncident("incident1", "user1", "team1");

			const updateArg = incidentsRepo.updateById.mock.calls[0][2] as Partial<Incident>;
			expect(updateArg.endTime).toBeDefined();
			expect(new Date(updateArg.endTime!).toISOString()).toBe(updateArg.endTime);
		});
	});

	// -----------------------------------------------------------------------
	// Integration / Scenario tests
	// -----------------------------------------------------------------------
	describe("scenario: sustained downtime (10 consecutive checks)", () => {
		it("creates exactly one incident across 10 failed checks", async () => {
			const created = makeIncident();
			// First check: no active incident → create
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(null);
			incidentsRepo.create.mockResolvedValue(created);

			// Checks 2-10: active incident exists → dedup
			for (let i = 1; i < 10; i++) {
				incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(created);
			}

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
			const monitor = makeMonitor();

			const results: (Incident | null)[] = [];
			for (let i = 0; i < 10; i++) {
				results.push(await service.handleIncident(monitor, 500, decision));
			}

			// All 10 calls return the same incident
			for (const r of results) {
				expect(r).toEqual(created);
			}
			// create() called only once (first check)
			expect(incidentsRepo.create).toHaveBeenCalledTimes(1);
			// findActiveByMonitorId called 10 times (once per check)
			expect(incidentsRepo.findActiveByMonitorId).toHaveBeenCalledTimes(10);
		});
	});

	describe("scenario: down → recovery → re-failure", () => {
		it("produces two incidents with the first resolved and the second active", async () => {
			const incident1 = makeIncident({ id: "inc1" });
			const incident1Resolved = makeIncident({
				id: "inc1",
				status: false,
				endTime: "2025-04-10T13:00:00.000Z",
				resolutionType: "automatic",
			});
			const incident2 = makeIncident({ id: "inc2" });

			// Step 1: monitor goes down → no active → create incident1
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(null);
			incidentsRepo.create.mockResolvedValueOnce(incident1);

			const createDecision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
			const result1 = await service.handleIncident(makeMonitor(), 500, createDecision);
			expect(result1).toEqual(incident1);
			expect(incidentsRepo.create).toHaveBeenCalledTimes(1);

			// Step 2: monitor recovers → resolve incident1
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(incident1);
			incidentsRepo.updateById.mockResolvedValueOnce(incident1Resolved);

			const resolveDecision = makeDecision({ shouldResolveIncident: true });
			const result2 = await service.handleIncident(makeMonitor({ status: "up" } as any), 200, resolveDecision);
			expect(result2?.status).toBe(false);
			expect(result2?.endTime).toBeDefined();
			expect(result2?.resolutionType).toBe("automatic");

			// Step 3: monitor goes down again → no active (inc1 resolved) → create incident2
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(null);
			incidentsRepo.create.mockResolvedValueOnce(incident2);

			const result3 = await service.handleIncident(makeMonitor(), 500, createDecision);
			expect(result3).toEqual(incident2);
			expect(result3?.id).not.toBe(incident1.id);
			expect(incidentsRepo.create).toHaveBeenCalledTimes(2);
		});
	});

	describe("scenario: rapid oscillation (down/up/down/up/down)", () => {
		it("creates and resolves incidents correctly through multiple state changes", async () => {
			const inc1 = makeIncident({ id: "inc1" });
			const inc1Resolved = makeIncident({ id: "inc1", status: false, endTime: "2025-04-10T12:05:00.000Z", resolutionType: "automatic" });
			const inc2 = makeIncident({ id: "inc2" });
			const inc2Resolved = makeIncident({ id: "inc2", status: false, endTime: "2025-04-10T12:15:00.000Z", resolutionType: "automatic" });
			const inc3 = makeIncident({ id: "inc3" });

			const createDecision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
			const resolveDecision = makeDecision({ shouldResolveIncident: true });
			const downMonitor = makeMonitor();
			const upMonitor = makeMonitor({ status: "up" } as any);

			// Down #1 → create inc1
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(null);
			incidentsRepo.create.mockResolvedValueOnce(inc1);
			const r1 = await service.handleIncident(downMonitor, 500, createDecision);
			expect(r1?.id).toBe("inc1");

			// Up #1 → resolve inc1
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(inc1);
			incidentsRepo.updateById.mockResolvedValueOnce(inc1Resolved);
			const r2 = await service.handleIncident(upMonitor, 200, resolveDecision);
			expect(r2?.status).toBe(false);

			// Down #2 → create inc2
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(null);
			incidentsRepo.create.mockResolvedValueOnce(inc2);
			const r3 = await service.handleIncident(downMonitor, 500, createDecision);
			expect(r3?.id).toBe("inc2");

			// Up #2 → resolve inc2
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(inc2);
			incidentsRepo.updateById.mockResolvedValueOnce(inc2Resolved);
			const r4 = await service.handleIncident(upMonitor, 200, resolveDecision);
			expect(r4?.status).toBe(false);

			// Down #3 → create inc3
			incidentsRepo.findActiveByMonitorId.mockResolvedValueOnce(null);
			incidentsRepo.create.mockResolvedValueOnce(inc3);
			const r5 = await service.handleIncident(downMonitor, 500, createDecision);
			expect(r5?.id).toBe("inc3");
			expect(r5?.status).toBe(true);

			// Total: 3 incidents created, 2 resolved
			expect(incidentsRepo.create).toHaveBeenCalledTimes(3);
			expect(incidentsRepo.updateById).toHaveBeenCalledTimes(2);
		});
	});

	describe("scenario: concurrent race condition", () => {
		it("two simultaneous create attempts result in one incident via fallback", async () => {
			const existing = makeIncident();
			const duplicateKeyError = new Error("E11000 duplicate key error");
			(duplicateKeyError as any).code = 11000;

			// Both checks see no active incident initially
			incidentsRepo.findActiveByMonitorId
				.mockResolvedValueOnce(null)   // Check A: initial lookup
				.mockResolvedValueOnce(null)   // Check B: initial lookup
				.mockResolvedValueOnce(existing); // Check B: fallback after dup error

			// Check A succeeds, Check B hits duplicate key
			incidentsRepo.create
				.mockResolvedValueOnce(existing)
				.mockRejectedValueOnce(duplicateKeyError);

			const decision = makeDecision({ shouldCreateIncident: true, incidentReason: "status_down" });
			const monitor = makeMonitor();

			// Simulate two concurrent calls
			const [resultA, resultB] = await Promise.all([
				service.handleIncident(monitor, 500, decision),
				service.handleIncident(monitor, 500, decision),
			]);

			// Both return the same incident
			expect(resultA).toEqual(existing);
			expect(resultB).toEqual(existing);
			// create() attempted twice, but only one succeeded
			expect(incidentsRepo.create).toHaveBeenCalledTimes(2);
		});
	});
});
