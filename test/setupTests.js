/* eslint-disable no-console */
import Enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";

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

/**
 * Enable additional assertions only present in development mode
 */
process.env.NODE_ENV = "development";
