import assert from "node:assert/strict";
import test from "node:test";
import { createInnovationTracker } from "../../scripts/modules/ai/neat/innovation-tracker.js";

test("innovationFor returns the same number for the same connection every time", () => {
    const tracker = createInnovationTracker(10);
    const first = tracker.innovationFor(0, 5);
    const second = tracker.innovationFor(0, 5);
    assert.equal(first, second);
});

test("innovationFor returns distinct, increasing numbers for distinct connections", () => {
    const tracker = createInnovationTracker(10);
    const a = tracker.innovationFor(0, 5);
    const b = tracker.innovationFor(1, 5);
    const c = tracker.innovationFor(0, 6);
    assert.notEqual(a, b);
    assert.notEqual(a, c);
    assert.notEqual(b, c);
    assert.ok(b > a);
    assert.ok(c > b);
});

test("innovationFor starts counting from the provided starting innovation number", () => {
    const tracker = createInnovationTracker(10, 100);
    assert.equal(tracker.innovationFor(0, 1), 100);
    assert.equal(tracker.innovationFor(1, 2), 101);
});

test("nodeIdForSplit returns the same new node id when the same connection is split again", () => {
    const tracker = createInnovationTracker(20);
    const first = tracker.nodeIdForSplit(0, 5);
    const second = tracker.nodeIdForSplit(0, 5);
    assert.equal(first, second);
    assert.equal(first, 20);
});

test("nodeIdForSplit gives distinct, increasing ids for distinct connections", () => {
    const tracker = createInnovationTracker(20);
    const a = tracker.nodeIdForSplit(0, 5);
    const b = tracker.nodeIdForSplit(1, 5);
    assert.notEqual(a, b);
    assert.equal(b, 21);
});

test("node ids and innovation numbers are tracked independently", () => {
    const tracker = createInnovationTracker(50, 0);
    const innovation = tracker.innovationFor(0, 1);
    const nodeId = tracker.nodeIdForSplit(0, 1);
    assert.equal(innovation, 0);
    assert.equal(nodeId, 50);
});
