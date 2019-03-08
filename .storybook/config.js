import { addParameters, configure } from '@storybook/react';

addParameters({
    options: {
        name: "JSON Schema Inspector",
        url: "https://github.com/CarstenWickner/react-jsonschema-inspector",
        showAddonPanel: false,
        showSearchBox: false
    }
});

function loadStories() {
    require('../stories/index.js');
}

configure(loadStories, module);