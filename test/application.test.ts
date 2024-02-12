// noinspection ES6PreferShortImport

import {expect, test} from "bun:test";
import {View} from "../src/ui/view";
import {state, State} from "../src/state";
import {mg, MgDiv} from "../src/ui/node_type";
import {Magnolia} from "../src/index";
import {init_happy_dom} from "./happy_dom";

init_happy_dom({
    url: "http://localhost"
});

test('application', () => {
    document.body.innerHTML = `<div id="root"></div>`;

    const root: HTMLElement | null = document.getElementById('root');

    if (root === null) {
        throw new Error("Application root element not found");
    }

    function root_view(): View {
        const view: View = new View();

        // State management
        const counter: State<number> = state(0);
        const inc_counter: () => void = () => counter.set(counter.get() + 1);
        const clicked_times: State<string> = counter.map((value: number): string => `Clicked ${value} times`);

        // View composition
        const div: MgDiv = mg.div();
        mg.p().bind_text(clicked_times).child_of(div);
        mg.button("+").on_click(inc_counter).id("button").child_of(div);

        return view.add_child(div);
    }

    function fallback_view(): View {
        const view: View = new View();

        const div: MgDiv = mg.div();
        mg.p("404 Not Found!").child_of(div);

        return view.add_child(div);
    }

    const magnolia: Magnolia = new Magnolia(root);

    magnolia.router().route("/", root_view);
    magnolia.router().fallback_to(fallback_view);

    magnolia.init();


    expect(document.body.innerHTML).toEqual(`<div id="root"><div><p>Clicked 0 times</p><button id="button">+</button></div></div>`)
    document.getElementById("button")?.click();
    expect(document.body.innerHTML).toEqual(`<div id="root"><div><p>Clicked 1 times</p><button id="button">+</button></div></div>`)

    magnolia.router().navigate("/non-existent-path");
    expect(document.body.innerHTML).toEqual(`<div id="root"><div><p>404 Not Found!</p></div></div>`)
});