import {mg, MgNode, MgNodeType} from "./node";

export type MgViewData = {
    path_segments: Map<string, string>
}

export type MgViewComposeFn = (data: MgViewData) => MgView;
export type MgViewComposeLazyFn = () => Promise<{ default: MgViewComposeFn }>;

export class MgView {
    children: MgNode[] = [];

    mount(
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

    unmount(): void {
        // Unmount and remove all children
        for (const child of this.children) {
            child.unmount()
        }

        this.children = [];
    }

    add_child(node: MgNodeType): MgView {
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
        //           This is because MgView#mount() function already checks that for us
        return this;
    }

}