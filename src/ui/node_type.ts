import {magnolia} from "../magnolia";
import {ChildNodeType, MgNode} from "./node";
import {View} from "./view";

// WIP added on the go as needed

// All HTML elements
// <a> <abbr> <address> <area> <article> <aside> <audio> <b> <base> <bdi> <bdo> <blockquote> <body> <br> <button> <canvas>
// <caption> <cite> <code> <col> <colgroup> <data> <datalist> <dd> <del> <details> <dfn> <dialog> <div> <dl> <dt> <em>
// <embed> <fieldset> <figcaption> <figure> <footer> <form> <h1> <head> <header> <hgroup> <hr> <html> <i> <iframe> <img>
// <input> <ins> <kbd> <label> <legend> <li> <link> <main> <map> <mark> <menu> <meta> <meter> <nav> <noscript> <object>
// <ol> <optgroup> <option> <output> <p> <picture> <pre> <progress> <q> <rp> <rt> <ruby> <s> <samp> <script> <search>
// <section> <select> <slot> <small> <source> <span> <strong> <style> <sub> <summary> <sup> <table> <tbody> <td> <template>
// <textarea> <tfoot> <th> <thead> <time> <title> <tr> <track> <u> <ul> <var> <video> <wbr>

// TODO (sebba): Add all (except deprecated) HTML elements
// Needs impl list
// <abbr> <address> <area> <article> <aside> <audio> <b> <base> <bdi> <bdo> <blockquote> <body> <br>
// <caption> <cite> <col> <colgroup> <data> <datalist> <dd> <del> <details> <dfn> <dialog> <dl> <dt> <em>
// <embed> <fieldset> <figcaption> <figure> <footer> <form> <head> <header> <hgroup> <hr> <html> <i> <iframe> <img>
// <input> <ins> <kbd> <label> <legend> <li> <link> <main> <map> <mark> <menu> <meta> <meter> <nav> <noscript> <object>
// <ol> <optgroup> <option> <output> <p> <picture> <progress> <q> <rp> <rt> <ruby> <s> <samp> <script> <search>
// <section> <select> <slot> <small> <source> <strong> <style> <sub> <summary> <sup> <template>
// <textarea> <tfoot> <time> <title> <track> <u> <ul> <var> <video> <wbr>

// Impl list
// <a> <button> <canvas> <code> <div> <h1-6> <p> <pre> <span> <table> <td> <th> <tr> <input>

export class MgAnchor extends MgNode {
    constructor(
        url: string,
        text?: string
    ) {
        super(document.createElement('a'));
        this.html_element.setAttribute('href', url);


        if (text) {
            this.text(text);
        }
    }

    open_in_new_tab(): MgAnchor {
        (this.html_element as HTMLAnchorElement).target = '_blank'
        return this;
    }
}

export class MgRouterAnchor extends MgAnchor {
    constructor(
        url: string,
        text?: string
    ) {
        super(url, text);
        this.html_element.onclick = (event: MouseEvent) => {
            event.preventDefault();
            magnolia.router().navigate(url);
        }
    }
}

export class MgButton extends MgNode {
    constructor(text?: string) {
        super(document.createElement('button'));

        if (text) {
            this.text(text);
        }
    }
}

export class MgCanvas extends MgNode {
    constructor() {
        super(document.createElement('canvas'));
    }
}

export class MgCode extends MgNode {
    constructor(text?: string) {
        super(document.createElement('code'));

        if (text) {
            this.text(text);
        }
    }
}

export class MgDiv extends MgNode {
    constructor() {
        super(document.createElement('div'));
    }
}

export class MgHeading extends MgNode {
    constructor(level: number, text?: string) {
        super(document.createElement(`h${level}`));

        if (text) {
            this.text(text);
        }
    }
}

export class MgParagraph extends MgNode {
    constructor(text?: string) {
        super(document.createElement('p'));

        if (text) {
            this.text(text);
        }
    }
}

export class MgPre extends MgNode {
    constructor() {
        super(document.createElement('pre'));
    }
}

export class MgSpan extends MgNode {
    constructor(text?: string) {
        super(document.createElement('span'));

        if (text) {
            this.text(text);
        }
    }
}

export class MgTable extends MgNode {
    constructor() {
        super(document.createElement('table'));
    }
}

export class MgTableCell extends MgNode {
    constructor(text?: string) {
        super(document.createElement('td'));

        if (text) {
            this.text(text);
        }
    }
}

export class MgTableRow extends MgNode {
    constructor() {
        super(document.createElement('tr'));
    }
}

export class MgTableHeadCell extends MgNode {
    constructor(text?: string) {
        super(document.createElement('th'));

        if (text) {
            this.text(text);
        }
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
    export function compose_view(node: ChildNodeType): View {
        return new View().add_child(node);
    }

    export function div(): MgDiv {
        return new MgDiv();
    }

    export function h1(text?: string): MgHeading {
        return new MgHeading(1, text);
    }

    export function h2(text?: string): MgHeading {
        return new MgHeading(2, text);
    }

    export function h3(text?: string): MgHeading {
        return new MgHeading(3, text);
    }

    export function h4(text?: string): MgHeading {
        return new MgHeading(4, text);
    }

    export function h5(text?: string): MgHeading {
        return new MgHeading(5, text);
    }

    export function h6(text?: string): MgHeading {
        return new MgHeading(6, text);
    }

    export function p(text?: string): MgParagraph {
        return new MgParagraph(text);
    }

    export function span(text?: string): MgSpan {
        return new MgSpan(text);
    }

    export function code(text?: string): MgCode {
        return new MgCode(text);
    }

    export function a(
        url: string,
        text?: string
    ): MgAnchor {
        return new MgAnchor(url, text);
    }

    export function router_a(
        url: string,
        text?: string
    ): MgAnchor {
        return new MgRouterAnchor(url, text);
    }

    export function button(text?: string): MgButton {
        return new MgButton(text);
    }

    export function canvas(): MgCanvas {
        return new MgCanvas();
    }

    export function input(): MgInput {
        return new MgInput();
    }

    export function pre(): MgPre {
        return new MgPre();
    }
}
