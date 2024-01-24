import {MgRouter} from "./router";
import {MgViewComposeFn, MgViewData} from "./view";

export class Magnolia {
    private readonly root_node: HTMLElement;
    private readonly root_data: MgViewData;
    private readonly mg_router: MgRouter;
    private views: (MgViewComposeFn | MgRouter)[] | undefined;

    constructor(root: HTMLElement) {
        this.root_node = root;
        this.root_data = {
            path_segments: new Map()
        };
        this.mg_router = new MgRouter(this.root_node);
    }

    public router(): MgRouter {
        return this.mg_router;
    }

    public init(): void {
        if (magnolia !== undefined) {
            throw new Error("Magnolia#init() was already called")
        }

        magnolia = this;

        // Get the current path
        const base: string = window.location.protocol + "//" + window.location.host;
        const path: string = window.location.href.replace(base, '');

        // View layout is not defined, just navigate to the current path using the router
        if (this.views === undefined) {
            this.mg_router.navigate(path, true);
            return;
        }

        // We have a view layout, mount the views
        for (const view of this.views) {
            if (view instanceof MgRouter) {
                this.mg_router.navigate(path, true);
                continue;
            }

            // We have to pass root_data to the view, but it's not actually used
            view(this.root_data).mount(this.root_node)
        }
    }

    public compose_view_layout(views: (MgViewComposeFn | MgRouter)[]) {
        this.views = views;
    }
}

// This restricts the global scope to only have one instance of Magnolia
// Is this a good idea? I honestly don't know, but it's what I'm choosing go with for now
export let magnolia: Magnolia;