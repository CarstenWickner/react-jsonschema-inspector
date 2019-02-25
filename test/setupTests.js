import Enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";

Enzyme.configure({
    adapter: new Adapter()
});

/**
 * Override console.error and console.warn to fail any tests where they are called.
 */
// eslint-disable-next-line no-console
console.error = (message) => {
    throw (message instanceof Error ? message : new Error(message));
};
// eslint-disable-next-line no-console
console.warn = (message) => {
    throw (message instanceof Error ? message : new Error(message));
};
