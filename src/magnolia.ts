import {Router} from "./view/router";
import {empty_data_fn, ViewComposeFn, ViewData} from "./view/view";

/**
 * Represents the Magnolia application.
 */
export class Magnolia {

    private readonly root_node: HTMLElement;
    private readonly root_data: ViewData;
    private readonly mg_router: Router;
    private views: (ViewComposeFn | Router)[] | undefined;

    constructor(root: HTMLElement) {
        this.root_node = root;
        this.root_data = empty_data_fn();
        this.mg_router = new Router(this.root_node);
    }

    /**
     * Retrieves the router associated with this instance.
     *
     * @return {Router} The router object.
     */
    public router(): Router {
        return this.mg_router;
    }

    /**
     * Initializes the Magnolia application.
     * This method sets up the necessary configuration and mounts the views.
     * If Magnolia#init() has already been called, it throws an error.
     * If no views are defined, it simply navigates to the current path using the view.
     * If views are defined, it mounts each view to the root node.
     *
     * @return {void}
     * @throws {Error} - If Magnolia#init() has already been called
     */
    public init(): void {
        if (magnolia !== undefined) {
            throw new Error("Magnolia#init() was already called")
        }

        magnolia = this;

        // Get the current path
        const base: string = window.location.protocol + "//" + window.location.host;
        const path: string = window.location.href.replace(base, '');

        // View layout is not defined, just navigate to the current path using the view
        if (this.views === undefined) {
            this.mg_router.navigate(path, true);
            return;
        }

        // We have a view layout, mount the views
        for (const view of this.views) {
            if (view instanceof Router) {
                this.mg_router.navigate(path, true);
                continue;
            }

            // We have to pass root_data to the view, but it's not actually used
            view(this.root_data).mount(this.root_node)
        }
    }

    /**
     * Defines the layout for a group of views.
     *
     * @param {Array<ViewComposeFn|Router>} views - An array of views or routers.
     */
    public define_view_layout(views: (ViewComposeFn | Router)[]) {
        this.views = views;
    }

}

// This restricts the global scope to only have one instance of Magnolia
// Is this a good idea? I honestly don't know, but it's what I'm choosing go with for now
export let magnolia: Magnolia;