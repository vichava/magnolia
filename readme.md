## `magnolia`

A simple, lightweight and fast UI library for the web. It has no runtime dependencies and is written in TypeScript.

### Usage

> **Foreword**: This library is still in development and is not really ready for production use. It is also not yet published publicly.
> We are also assuming that you are familiar with the web development ecosystem and know how to set up a project.
>
> Proper documentation for the project will be added soon-ish, for now start with this

After adding the library to your project, you need to create an index.html file and set up init logic in the main.ts file. 

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>magnolia UI</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.ts"></script>
<noscript>
    <h1>JavaScript is disabled :/</h1>
</noscript>
</body>
</html>
```

Next, you need to create a main.ts file and set up the views and init logic.
Magnolia provides routing (normal && lazy), state management and view composition api.

*Lazy routing can be archived by moving view to another module that default exports the view and using `Router#route_lazy(path, view_fn)` method*

```ts
import {Magnolia} from "@vichava/magnolia";
import {View} from "@vichava/magnolia/ui/view";
import {state, State} from "@vichava/magnolia/state";
import {mg, MgDiv} from "@vichava/magnolia/ui/node_type";

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
    mg.button("+").on_click(inc_counter).child_of(div);

    return view.add_child(div);
}

function fallback_view(): View {
    const view: View = new View();

    const div: MgDiv = mg.div();
    mg.p("404 Not Found!").child_of(div);

    return view.add_child(div);
}

const magnolia: Magnolia = new Magnolia(root);

// Routing
magnolia.router().route("/", root_view);
magnolia.router().fallback_to(fallback_view);

magnolia.init();
```
