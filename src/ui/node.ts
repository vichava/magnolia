import {State} from "../state";

export type ChildNode = MgNode | null
export type ChildNodeType = ChildNode | ChildNode[];

// Named MgNode to avoid confusion with Node type from lib.dom.d.ts
export class MgNode {

    protected readonly html_element: HTMLElement;
    protected children_elements: MgNode[] = [];
    protected mount_callback_fn: (() => void) | null = null;
    protected unmount_callback_fn: (() => void) | null = null;

    constructor(element: HTMLElement) {
        this.html_element = element;
    }

    /**
     * Returns the HTML element of type T associated with this class.
     *
     * @template T - The type of HTML element to be returned
     * @returns The HTML element of type T
     */
    public element<T extends HTMLElement = HTMLElement>(): T {
        return this.html_element as T;
    }

    /**
     * Returns an array of child nodes for this MgNode.
     *
     * @return {MgNode[]} - An array of child nodes for this MgNode
     */
    public children(): MgNode[] {
        return this.children_elements;
    }

    /**
     * Mounts the element to a specified parent element at a given reference node.
     *
     * @param {HTMLElement} parent - The parent element to mount the element to
     * @param {HTMLElement|null} ref_node - The reference node to insert the element before, or null to append it as the last child
     * @returns {void}
     */
    public mount(
        parent: HTMLElement,
        ref_node: HTMLElement | null
    ): void {
        if (ref_node !== null) {
            parent.insertBefore(this.element(), ref_node);
        } else {
            parent.appendChild(this.element());
        }

        if (this.mount_callback_fn !== null) {
            this.mount_callback_fn();
        }
    }

    /**
     * Unmounts the component and performs necessary cleanup operations.
     *
     * @return {void}
     */
    public unmount(): void {
        // TODO (sebba): Figure out where unmount callback should be called
        if (this.unmount_callback_fn !== null) {
            this.unmount_callback_fn();
        }

        for (const child of this.children_elements) {
            child.unmount();
        }

        this.html_element.remove();
    }

    /**
     * Registers a callback function to be executed when the node is mounted.
     *
     * @param {Function} fn - The callback function to be executed.
     * @returns {MgNode} - The current MgNode instance.
     */
    public on_mount(fn: () => void): MgNode {
        this.mount_callback_fn = fn;
        return this;
    }

    /**
     * Registers a callback function to be executed when the component is unmounted.
     *
     * @param {Function} fn - The function to be executed on unmount.
     * @return {MgNode} - Returns the current instance of MgNode for method chaining.
     */
    public on_unmount(fn: () => void): MgNode {
        this.unmount_callback_fn = fn;
        return this;
    }

    /**
     * Unmounts all children elements.
     *
     * @return {void}
     */
    public unmount_children(): void {
        for (const child of this.children_elements) {
            child.unmount();
        }

        this.children_elements = [];
    }

    /**
     * Attaches the current node as a child of the specified parent node.
     *
     * @param {MgNode} parent - The parent node to attach the current node to.
     *                        Must be an instance of MgNode.
     */
    // TODO (sebba): In theory nodes are mounted at the last possible moment, should we guide devs to do that by retuning void here?
    public child_of(parent: MgNode): void {
        parent.mount_child(this);
    }

    /**
     * Adds a child node to the current node.
     *
     * @param {ChildNodeType} node - The child node to be added.
     *
     * @return {MgNode} - The current node with the added child node.
     */
    public add_child(node: ChildNodeType): MgNode {
        if (node === null) {
            return this;
        }

        if (node instanceof MgNode) {
            this.mount_child(node);
            return this;
        }

        for (const mg_element of node) {
            if (mg_element === null) {
                continue;
            }

            this.mount_child(mg_element);
        }

        return this;
    }

    /**
     * Sets the inner text of the HTML element.
     *
     * @param {string} text - The text to be set as the inner text of the HTML element.
     * @returns {MgNode} - The current MgNode instance.
     */
    public text(text: string): MgNode {
        this.html_element.innerText = text;
        return this;
    }

    /**
     * Binds the text of the MgNode to a State object.
     *
     * @param {State<string>} state - The State object to bind the text with.
     * @return {MgNode} - The MgNode instance.
     */
    public bind_text(state: State<string>): MgNode {
        this.text(state.get());

        state.bind((value: string): void => {
            this.text(value);
        });

        return this;
    }

    /**
     * Adds one or more CSS classes to the HTML element of the MgNode.
     * If `name` is a string, it adds the class to the HTML element.
     * If `name` is an array of strings, it adds multiple classes to the HTML element.
     *
     * @param {string|string[]} name - The CSS class name(s) to be added.
     * @throws {Error} - If `name` is undefined, an error will be thrown.
     *
     * @return {MgNode} - The modified MgNode instance with the added CSS class(es).
     */
    public style(name: string | string[]): MgNode {
        if (name === undefined) {
            throw new Error(`Class name must be defined for component ${this.html_element}`);
        }

        if (typeof name === 'string') {
            this.html_element.classList.add(name);
            return this;
        }

        for (const class_name of name) {
            this.html_element.classList.add(class_name);
        }

        return this;
    }

    /**
     * Binds a state to the style of the MgNode.
     *
     * @param {State<string[]>} state - The state to bind
     * @returns {MgNode} - The MgNode object
     */
    public bind_style(state: State<string[]>): MgNode {
        this.style(state.get());

        state.bind((value: string[], old_value: string[]): void => {
            const shared_classes: string[] = [];
            const new_classes: string[] = [];

            // Split the new values into classes that are shared with the old values and classes that are not
            for (let class_name of value) {
                if (old_value.includes(class_name)) {
                    shared_classes.push(class_name);
                } else {
                    new_classes.push(class_name);
                }
            }

            // Clear the old classes that are not shared with the new classes
            for (const class_name of old_value) {
                if (shared_classes.includes(class_name)) {
                    continue;
                }

                this.html_element.classList.remove(class_name);
            }

            // Add the new classes
            this.style(new_classes);
        })

        return this;
    }

    /**
     * Sets the id for the HTML element associated with this MgNode instance.
     *
     * @param {string} id - The id to be set for the HTML element
     * @returns {MgNode} - Returns the MgNode instance
     */
    public id(id: string): MgNode {
        this.html_element.id = id;
        return this;
    }

    /**
     * Binds the provided state to the id property of the MgNode instance.
     *
     * @param {State<string>} state - The state to bind to the id property
     * @return {MgNode} - The current MgNode instance
     */
    public bind_id(state: State<string>): MgNode {
        this.id(state.get());

        state.bind((value: string): void => {
            this.id(value);
        });

        return this;
    }

    /**
     * Mounts a child element onto the parent element.
     *
     * @param {MgNode} child - The child element to be mounted
     * @protected
     * @returns {void}
     */
    protected mount_child(child: MgNode): void {
        this.children_elements.push(child);
        child.mount(this.html_element, null);
    }

    /**
     * Attaches a click event handler to the HTML element associated with the MgNode.
     *
     * @param {function(MouseEvent): any} fn - The callback function to be executed when the element is clicked.
     * @return {MgNode} - The current MgNode object.
     */
    on_click(fn: (event: MouseEvent) => any): MgNode {
        this.html_element.onclick = fn;
        return this;
    }

}
