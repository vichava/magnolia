// @ts-ignore
import {GlobalRegistrator} from "@happy-dom/global-registrator";
// @ts-ignore
import type {IOptionalBrowserSettings} from "happy-dom";

export function init_happy_dom(
    options?: {
        width?: number;
        height?: number;
        url?: string;
        settings?: IOptionalBrowserSettings;
    }
): void {
    try {
        GlobalRegistrator.unregister();
    } catch (exception) {}


    GlobalRegistrator.register(options);
    console.log("[init] Happy DOM initialized");
}