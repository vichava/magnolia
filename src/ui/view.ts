import {ChildNodeType, MgNode} from "./node";
import {mg} from "./node_type";

export type PathSegments = Map<string, string>;

export type ViewData = {
    path_segments: PathSegments
}

export const empty_data_fn: () => ViewData = (): ViewData => ({
    path_segments: new Map()
})

export const data_fn: (path_segments: PathSegments) => ViewData = (path_segments: PathSegments): ViewData => ({
    path_segments
});

export type ViewComposeFn = (data: ViewData) => View;
export type ViewComposeLazyFn = () => Promise<{ default: ViewComposeFn }>;

/**
 * Represents a view component that manages child elements and provides methods for mounting and unmounting them.
 */
export class View {

    public children: MgNode[] = [];

    /**
     * Mounts the child elements of the View instance to the specified root element.
     * If no child elements were added to the instance, an empty view is created and mounted.
     *
     * @param {HTMLElement} root - The root element to mount the child elements to.
     * @param {HTMLElement|null} ref_node - The reference node to insert the child elements before. If null, the child elements will be appended to the root element.
     * @returns {void}
     */
    public mount(
        root: HTMLElement,
        ref_node: HTMLElement | null = null
    ): void {
        // Check if MgView#compose() created at least one child
        if (this.children.length == 0) {
            // No children were added, create an empty view
            this.add_child(null)
        }

        // We have at least one child, mount them to the root node
        for (const child of this.children) {
            child.mount(root, ref_node);
        }
    }

    /**
     * Unmounts and removes all children of the current component.
     *
     * @return {void}
     */
    public unmount(): void {
        // Unmount and remove all children
        for (const child of this.children) {
            child.unmount()
        }

        this.children = [];
    }

    /**
     * Adds a child node to the view.
     *
     * @param {ChildNodeType} node - The node to be added as a child.
     * @returns {View} - The updated view with the newly added child node.
     */
    public add_child(node: ChildNodeType): View {
        if (node === null) {
            // View must always have at least one child
            this.children.push(mg.div())
            return this;
        }

        if (node instanceof MgNode) {
            this.children.push(node);
            return this;
        }

        for (const element of node) {
            // Null elements are simply ignored - supports ternary operators
            if (element === null) {
                continue;
            }

            this.children.push(element);
        }

        // Dev note: If statement here to check if we have at least one child is not needed.
        //           This is because View#mount() function already checks that for us
        return this;
    }

}
