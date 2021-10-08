import customTheme from "./theme";

export const parameters = {
    docs: {
        theme: customTheme
    },
    layout: "fullscreen",
    options: {
        storySort: {
            method: "alphabetical",
            order: ["Inspector", "*"]
        }
    }
};
