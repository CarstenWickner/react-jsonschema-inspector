/* eslint-disable no-console */
import * as Enzyme from "enzyme";
import * as Adapter from "enzyme-adapter-react-16";

Enzyme.configure({
    adapter: new Adapter()
});

/**
 * Override console.error and console.warn to fail any tests where they are called.
 */
console.error = (message) => {
    throw (message instanceof Error ? message : new Error(message));
};
console.warn = (message) => {
    throw (message instanceof Error ? message : new Error(message));
};
