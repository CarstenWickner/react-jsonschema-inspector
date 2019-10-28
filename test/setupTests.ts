import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

configure({
    adapter: new Adapter()
});

/**
 * Override console.error and console.warn to fail any tests where they are called.
 */
console.error = (message: Error | string): never => {
    throw message instanceof Error ? message : new Error(message);
};
console.warn = (message: Error | string): never => {
    throw message instanceof Error ? message : new Error(message);
};
