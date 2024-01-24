import {MgView, MgViewComposeFn, MgViewComposeLazyFn, MgViewData} from "./view";

enum ViewTypeEnum {
    Fn,
    LazyFn
}

type ViewFnType = {
    type: ViewTypeEnum,
    fn: MgViewComposeFn | MgViewComposeLazyFn
}

type ActiveView = {
    url: string,
    view: MgView
}

type DynamicSegment = {
    name: string,
    value: string
}

function normalize_path(path: string): string {
    if (path.endsWith('/')) {
        return path.substring(0, path.length - 1);
    }

    return path;
}

/**
 * Matches the provided path to the target path.
 *
 * @param {string} path - The path to be matched.
 * @param {string} target - The target path to match against.
 * @return {boolean} - Returns true if the provided path matches the target path, otherwise returns false.
 */
function match_dynamic_path(
    path: string,
    target: string
): [boolean, DynamicSegment[] | null] {
    if (!target.includes('{') && !target.includes('}')) {
        console.log(`Skipping path match on path '${path}' for target '${target}' - it does not contain dynamic segments`)
        return [false, null]
    }

    console.log(`Checking matching path for '${path}' to target '${target}'`);

    const path_segments = path.split('/');
    const target_segments = target.split('/');
    const contains_wildcard = target.includes(":*");

    console.log(`Wildcard status for target '${target}': ${contains_wildcard}`)

    if (!contains_wildcard && path_segments.length !== target_segments.length) {
        return [false, null];
    }

    if (contains_wildcard) {
        throw new Error("Wildcards are not supported yet")
    }

    const dynamic_segments: DynamicSegment[] = [];

    for (let path_index = 0; path_index < path_segments.length; path_index++) {
        const path_seg = path_segments[path_index];
        const target_seg = target_segments[path_index];

        if (target_seg.startsWith('{') && target_seg.endsWith('}')) {
            // Okay, we have a dynamic path component
            const component_name = target_seg.substring(1, target_seg.length - 1);
            const component_value = path_seg;

            console.log(`Matched a dynamic component ${component_name}: ${component_value}`)

            dynamic_segments.push({
                name: component_name,
                value: component_value
            })
        } else {
            if (path_seg !== target_seg) {
                return [false, null];
            }
        }
    }

    console.log(`Matched path '${path}' to target '${target}'`);

    return [true, dynamic_segments];
}

export class MgRouter {
    routes: Map<string, ViewFnType> = new Map();
    fallback: ViewFnType | null = null;
    active: ActiveView | null = null;
    root: HTMLElement;
    on_router_load_fn: ((path: string) => void)[] = [];

    constructor(root: HTMLElement) {
        window.onpopstate = () => this.load(location.pathname);
        this.root = root;
    }

    private attach_to_ref_node(root: HTMLElement, view: MgView): HTMLElement {
        if (view.children.length != 0) {
            const placement_ref_node: HTMLElement = view.children[0].element();

            const router_ref_node: HTMLElement = document.createElement('div')
            root.insertBefore(router_ref_node, placement_ref_node);


            console.debug("Attached ref node successfully")
            return router_ref_node;
        } else {
            console.error("View has no children, unable to set ref node, router view order might become unordered")
            return root;
        }
    }

    public on_router_load(fn: (path: string) => void): void {
        this.on_router_load_fn.push(fn);
    }

    private mount_view(
        path: string,
        view_fn: (data: MgViewData) => MgView,
        data: MgViewData,
    ): void {
        let ref_node: HTMLElement | null = null;

        if (this.active !== null) {
            console.debug(`unloading ${this.active.url}`)

            ref_node = this.attach_to_ref_node(this.root, this.active.view);

            this.active.view.unmount()
        }

        const label: string = `view-load-${path}`;
        console.time(label);

        const view: MgView = view_fn(data);
        view.mount(this.root, ref_node);

        if (ref_node !== null) {
            ref_node.remove();
        }

        this.active = {
            url: path,
            view: view
        }

        for (const fn of this.on_router_load_fn) {
            fn(path);
        }

        console.timeEnd(label);
    }

    private compose_view(
        route_path_template: string,
        path: string,
        view_type: ViewFnType,
        data: MgViewData,
    ): void {
        if (view_type.type === ViewTypeEnum.Fn) {
            const view_fn: MgViewComposeFn = view_type.fn as MgViewComposeFn;
            this.mount_view(path, view_fn, data);
            return;
        }

        const view_fn: MgViewComposeLazyFn = view_type.fn as MgViewComposeLazyFn;
        view_fn().then((module) => {
            console.log("Lazy loaded module")
            console.log(module)

            const view_fn: MgViewComposeFn = module.default;

            // TODO: Figure out if this actually improves performance or can we rely on the browser to cache our import(path) files
            this.routes.set(route_path_template!, {
                type: ViewTypeEnum.Fn,
                fn: view_fn
            });

            this.mount_view(path, view_fn, data);
        })
    }

    load(path: string): void {
        // profile this
        console.time('load')

        console.debug(`loading ${path}`)

        const normalized_path = normalize_path(path);

        const q_match: ViewFnType | undefined = this.routes.get(normalized_path);

        if (q_match !== undefined) {
            console.debug(`Quick matched path '${path}'`);

            const data: MgViewData = {
                path_segments: new Map()
            }

            this.compose_view(path, path, q_match, data);

            console.timeEnd('load')
            return;
        }

        for (const [route_path, route_view] of this.routes.entries()) {
            const [match, segments] = match_dynamic_path(normalized_path, route_path);

            if (!match) {
                continue;
            }

            const path_segments: Map<string, string> = segments == null ? new Map() : new Map(segments.map(segment => [segment.name, segment.value]));

            const data: MgViewData = {
                path_segments
            }

            this.compose_view(route_path, path, route_view, data);

            console.timeEnd('load')
            return;
        }

        const view: ViewFnType | null = this.fallback;

        if (view === null) {
            throw new Error(`no fallback view for ${path}`);
        }

        const data: MgViewData = {
            path_segments: new Map()
        }

        this.compose_view(path, path, view, data);
        console.timeEnd('load')
    }

    navigate(path: string, replace: boolean = false): void {
        console.debug(`navigating to ${path}`)

        if (replace) {
            history.replaceState({}, '', path);
        } else {
            history.pushState({}, '', path);
        }

        this.load(path);
    }

    route(path: string, view: MgViewComposeFn): void {
        this.routes.set(normalize_path(path), {
            type: ViewTypeEnum.Fn,
            fn: view
        });
    }

    route_lazy(path: string, view: MgViewComposeLazyFn): void {
        this.routes.set(normalize_path(path), {
            type: ViewTypeEnum.LazyFn,
            fn: view
        });
    }

    fallback_to(view: (data: MgViewData) => MgView): void {
        this.fallback = {
            type: ViewTypeEnum.Fn,
            fn: view
        };
    }
}