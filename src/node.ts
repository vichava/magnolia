import {magnolia} from "./magnolia";

export type MgNodeType = null | MgNode | (MgNode | null)[];

export class MgNode {
    protected readonly html_element: HTMLElement;
    protected children_elements: MgNode[] = [];
    protected mount_callback_fn: (() => void) | null = null;
    protected unmount_callback_fn: (() => void) | null = null;

    constructor(element: HTMLElement) {
        this.html_element = element;
    }

    public element<T extends HTMLElement = HTMLElement>(): T {
        return this.html_element as T;
    }

    public children(): MgNode[] {
        return this.children_elements;
    }

    protected mount_child(child: MgNode): void {
        this.children_elements.push(child);
        child.mount(this.html_element, null);
    }

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

    on_mount(fn: () => void): MgNode {
        this.mount_callback_fn = fn;
        return this;
    }

    on_unmount(fn: () => void): MgNode {
        this.unmount_callback_fn = fn;
        return this;
    }

    unmount_children(): void {
        for (const child of this.children_elements) {
            child.unmount();
        }

        this.children_elements = [];
    }

    // TODO (sebba): In theory nodes are mounted at the last possible moment, should we guide devs to do that by retuning void here?
    public child_of(parent: MgNode): void {
        parent.mount_child(this);
    }

    public add_child(node: MgNodeType): MgNode {
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

    text(text: string): MgNode {
        this.html_element.innerText = text;
        return this;
    }

    style(name: string | string[]): MgNode {
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

    id(id: string): MgNode {
        this.html_element.id = id;
        return this;
    }

}

export class MgDiv extends MgNode {
    constructor() {
        super(document.createElement('div'));
    }
}

export class MgParagraph extends MgNode {
    constructor(text: string) {
        super(document.createElement('p'));
        this.text(text);
    }
}

export class MgSpan extends MgNode {
    constructor(text: string) {
        super(document.createElement('span'));
        this.text(text);
    }
}

export class MgCode extends MgNode {
    constructor(text: string) {
        super(document.createElement('code'));
        this.text(text);
    }
}

export class MgAnchor extends MgNode {
    constructor(
        url: string,
        text: string
    ) {
        super(document.createElement('a'));
        this.text(text);
        this.html_element.setAttribute('href', url);
    }

    open_in_new_tab(): MgAnchor {
        (this.html_element as HTMLAnchorElement).target = '_blank'
        return this;
    }
}

export class MgRouterAnchor extends MgAnchor {
    constructor(
        url: string,
        text: string
    ) {
        super(url, text);
        this.html_element.onclick = (event: MouseEvent) => {
            event.preventDefault();
            magnolia.router().navigate(url);
        }
    }
}

export class MgButton extends MgNode {
    constructor(text: string) {
        super(document.createElement('button'));
        this.text(text);
    }

    on_click(fn: () => void): MgButton {
        this.html_element.onclick = fn;
        return this;
    }
}

export class MgTable extends MgNode {
    constructor() {
        super(document.createElement('table'));
    }
}

export class MgTableRow extends MgNode {
    constructor() {
        super(document.createElement('tr'));
    }
}

export class MgTableHeadCell extends MgNode {
    constructor(text: string) {
        super(document.createElement('th'));
        this.text(text);
    }
}

export class MgTableCell extends MgNode {
    constructor(text: string) {
        super(document.createElement('td'));
        this.text(text);
    }
}

export class MgCanvas extends MgNode {
    constructor() {
        super(document.createElement('canvas'));
    }
}

export class MgInput extends MgNode {
    constructor() {
        super(document.createElement('input'));
    }

    on_input(fn: (event: Event) => void): MgInput {
        this.html_element.oninput = fn;
        return this;
    }
}

export namespace mg {
    export function div(): MgDiv {
        return new MgDiv();
    }

    export function p(text: string = ''): MgParagraph {
        return new MgParagraph(text);
    }

    export function span(text: string = ''): MgSpan {
        return new MgSpan(text);
    }

    export function code(text: string = ''): MgCode {
        return new MgCode(text);
    }

    export function a(
        url: string,
        text: string
    ): MgAnchor {
        return new MgAnchor(url, text);
    }

    export function router_a(
        url: string,
        text: string = ''
    ): MgAnchor {
        return new MgRouterAnchor(url, text);
    }

    export function button(text: string): MgButton {
        return new MgButton(text);
    }

    export function canvas(): MgCanvas {
        return new MgCanvas();
    }

    export function input(): MgInput {
        return new MgInput();
    }
}
