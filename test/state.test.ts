import {expect, test} from "bun:test";
import {State} from "../src/state";

test("state", () => {
    const state = new State(0);
    const mapped = state.map((value) => value * 2);

    expect(state.get()).toBe(0);
    expect(mapped.get()).toBe(0);

    state.set(1);

    expect(state.get()).toBe(1);
    expect(mapped.get()).toBe(2);

    const eq_state = new State(0, (a, b) => a > b);

    expect(eq_state.get()).toBe(0);

    eq_state.set(1);

    expect(eq_state.get()).toBe(1);

    eq_state.set(0);

    expect(eq_state.get()).toBe(1);
});
