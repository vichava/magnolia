import {expect, test} from "bun:test";
import {mg, MgParagraph} from "../src/ui/node_type";
import {State, state} from "../src/state";
import {init_happy_dom} from "./happy_dom";

init_happy_dom()

test('style bind', () => {
    document.body.innerHTML = `<div id="root"></div>`;
    const root: HTMLElement = document.getElementById("root")!;

    const classes: State<string[]> = state(["one"])

    const node: MgParagraph = mg.p("Hello world!");
    node.mount(root, null);
    node.bind_style(classes)

    expect(node.element().classList.contains("one")).toEqual(true);

    classes.set(["one", "two"])
    expect(node.element().classList.contains("one")).toEqual(true);
    expect(node.element().classList.contains("two")).toEqual(true);

    classes.set(["two"])
    expect(node.element().classList.contains("one")).toEqual(false);
    expect(node.element().classList.contains("two")).toEqual(true);

    classes.set([])
    expect(node.element().classList.contains("one")).toEqual(false);
    expect(node.element().classList.contains("two")).toEqual(false);
});