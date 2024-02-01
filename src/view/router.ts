import {data_fn, empty_data_fn, View, ViewComposeFn, ViewComposeLazyFn, ViewData} from "./view";

enum ViewTypeEnum {
    Fn = 0,
    LazyFn = 1
}

type ViewFnType = {
    type: ViewTypeEnum,
    fn: ViewComposeFn | ViewComposeLazyFn
}

type ActiveView = {
    url: string,
    view: View
}

type DynamicSegment = {
    name: string,
    value: string
}

/**
 * Normalizes the given path by removing the trailing '/' if it exists.
 *
 * @param {string} path - The path to be normalized.
 * @return {string} - The normalized path.
 */
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
    // Don't bother matching if the target doesn't contain any dynamic segments
    if (!target.includes('{') && !target.includes('}')) {
        return [false, null]
    }

    const path_segments: string[] = path.split('/');
    const target_segments: string[] = target.split('/');
    const contains_wildcard: boolean = target.includes(":*");

    if (!contains_wildcard && path_segments.length !== target_segments.length) {
        return [false, null];
    }

    if (contains_wildcard) {
        // TODO (sebba): Implement wildcards support - we should probably match wildcards after all dynamic segments have been matched?
        throw new Error("Wildcards are not supported yet")
    }

    const dynamic_segments: DynamicSegment[] = [];

    // Check if the path matches the target segment by segment
    for (let path_index = 0; path_index < path_segments.length; path_index++) {
        const path_seg: string = path_segments[path_index];
        const target_seg: string = target_segments[path_index];

        if (target_seg.startsWith('{') && target_seg.endsWith('}')) {
            // Okay, we have a dynamic path component - extract the component name and value
            const component_name: string = target_seg.substring(1, target_seg.length - 1);

            dynamic_segments.push({
                name: component_name,
                value: path_seg
            })
        } else {
            // This is a static path component, check if it matches the target
            if (path_seg !== target_seg) {
                return [false, null];
            }
        }
    }

    // We have a match, return the dynamic segments
    return [true, dynamic_segments];
}

/**
 * Creates a reference node for a given view in the DOM hierarchy.
 * This reference node is used for positioning other elements in relation to the view.
 *
 * @param {HTMLElement} root - The root element of the DOM hierarchy.
 * @param {View} view - The view object for which to create the reference node.
 * @returns {HTMLElement} - The created reference node.
 * If the view has at least one child, the reference node is inserted before the first child's element.
 * If the view has no children, the root element is returned instead.
 * Note: If the view has no children, this is not a fatal error, but it should be noted as view composition can become unordered.
 */
function create_ref_node(
    root: HTMLElement,
    view: View
): HTMLElement {
    // Check if the view has any children - we can't create a ref node if it doesn't
    if (view.children.length != 0) {
        // We have at least one child, create a ref node before the first child
        const placement_ref_node: HTMLElement = view.children[0].element();

        const router_ref_node: HTMLElement = document.createElement('div')
        root.insertBefore(router_ref_node, placement_ref_node);

        return router_ref_node;
    } else {
        // Not a fatal error, but it should be noted as view composition can become unordered
        console.error("View has no children, unable to set ref node, view view order might become unordered")
        return root;
    }
}

/**
 * Router class for managing routes and views in a web application.
 */
export class Router {

    routes: Map<string, ViewFnType> = new Map();
    fallback: ViewFnType | null = null;
    active: ActiveView | null = null;
    root: HTMLElement;
    on_router_load_fn: ((path: string) => void)[] = [];

    constructor(root: HTMLElement) {
        window.onpopstate = () => this.load(location.pathname);
        this.root = root;
    }

    /**
     * Mounts a view onto the specified path with the given data.
     *
     * @param {string} path - The path to mount the view onto
     * @param {function} view_fn - The function that returns the view to be mounted
     * @param {object} data - The data to be passed to the view
     * @private
     * @returns {void}
     */
    private mount_view(
        path: string,
        view_fn: (data: ViewData) => View,
        data: ViewData,
    ): void {
        let ref_node: HTMLElement | null = null;

        // Check if we have an active view, if so, unmount it
        if (this.active !== null) {
            // Create a ref node for the new view to attach to
            ref_node = create_ref_node(this.root, this.active.view);

            this.active.view.unmount()
        }

        // Composition of the view
        const view: View = view_fn(data);

        // Mount the view with the ref node
        view.mount(this.root, ref_node);

        // Clean up the ref node
        if (ref_node !== null) {
            ref_node.remove();
        }

        this.active = {
            url: path,
            view: view
        }

        // Call all on_router_load_fn callbacks
        for (const fn of this.on_router_load_fn) {
            fn(path);
        }
    }

    /**
     * Composes a view and mounts it to the root node.
     *
     * @param {string} route_path_template - The route path template
     * @param {string} path - The path where the view will be mounted
     * @param {ViewFnType} view_type - The type of the view (Fn or LazyFn)
     * @param {ViewData} data - The data to be passed to the view
     * @private
     * @return {void}
     */
    private compose_view(
        route_path_template: string,
        path: string,
        view_type: ViewFnType,
        data: ViewData,
    ): void {
        // Check if we need to lazy load the view
        if (view_type.type === ViewTypeEnum.Fn) {
            // No lazy loading needed, just mount the view
            const view_fn: ViewComposeFn = view_type.fn as ViewComposeFn;
            this.mount_view(path, view_fn, data);
            return;
        }

        // We need to lazy load the view
        const view_fn: ViewComposeLazyFn = view_type.fn as ViewComposeLazyFn;

        view_fn().then((module) => {
            const view_fn: ViewComposeFn = module.default;

            // Cache the view for future use as a normal view function
            // TODO: Figure out if this actually improves performance or can we rely on the browser to cache our import(path) files
            this.routes.set(route_path_template!, {
                type: ViewTypeEnum.Fn,
                fn: view_fn
            });

            this.mount_view(path, view_fn, data);
        })
    }

    /**
     * Loads a view based on the given path.
     *
     * @param {string} path - The path for the view
     * @private
     * @returns {void}
     */
    private load(path: string): void {
        const normalized_path: string = normalize_path(path);

        // Try to find quick match for the path (direct 1:1 match)
        const quick_match: ViewFnType | undefined = this.routes.get(normalized_path);

        if (quick_match !== undefined) {
            this.compose_view(path, path, quick_match, empty_data_fn());
            return;
        }

        // No quick match found, check for dynamic paths
        for (const [route_path, route_view] of this.routes.entries()) {
            const [match, segments]: [boolean, DynamicSegment[] | null] = match_dynamic_path(normalized_path, route_path);

            if (!match) {
                continue;
            }

            // We have a match, compose the view with the dynamic segments as data
            const path_segments: Map<string, string> = segments == null ?
                new Map() :
                new Map(segments.map((segment: DynamicSegment) => [segment.name, segment.value]));

            const data: ViewData = data_fn(path_segments);

            this.compose_view(route_path, path, route_view, data);
            return;
        }

        // No match found, fallback to the fallback view
        const view: ViewFnType | null = this.fallback;

        if (view === null) {
            throw new Error(`No fallback view for ${path}`);
        }

        const data: ViewData = {
            path_segments: new Map()
        }

        this.compose_view(path, path, view, data);
    }


    /**
     * Navigates to a specified path and updates the browser history.
     *
     * @param {string} path - The path to navigate to
     * @param {boolean} [replace=false] - An optional flag indicating whether to replace the current history state
     * @returns {void}
     */
    public navigate(
        path: string,
        replace: boolean = false
    ): void {
        if (replace) {
            history.replaceState({}, '', path);
        } else {
            history.pushState({}, '', path);
        }

        this.load(path);
    }

    /**
     * Registers a route with the given path and view compose function.
     *
     * @param {string} path - The path to be routed
     * @param {ViewComposeFn} view - The view function to be mapped to the path
     * @return {void}
     */
    public route(path: string, view: ViewComposeFn): void {
        this.routes.set(normalize_path(path), {
            type: ViewTypeEnum.Fn,
            fn: view
        });
    }

    /**
     * Registers a lazy-loaded route with the given path and view compose function.
     *
     * @param {string} path - The path for the route
     * @param {ViewComposeLazyFn} view - The function that composes the lazy-loaded view
     * @return {void}
     */
    public route_lazy(path: string, view: ViewComposeLazyFn): void {
        this.routes.set(normalize_path(path), {
            type: ViewTypeEnum.LazyFn,
            fn: view
        });
    }

    /**
     * Sets the fallback view that will be used when no other view matches the path.
     *
     * @param {ViewComposeFn} view - The fallback view function
     * @return {void}
     */
    public fallback_to(view: ViewComposeFn): void {
        this.fallback = {
            type: ViewTypeEnum.Fn,
            fn: view
        };
    }

    /**
     * Registers a callback that will be called when the router loads a view.
     *
     * @param {function} fn - The callback function
     * @returns {void}
     */
    public on_router_load(fn: (path: string) => void): void {
        this.on_router_load_fn.push(fn);
    }

}