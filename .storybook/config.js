import { addParameters, configure } from '@storybook/react';

addParameters({
    options: {
        name: "Inspector",
        url: "https://github.com/CarstenWickner/react-jsonschema-inspector"
    }
});

function loadStories() {
    require('../stories/index.js');
}

configure(loadStories, module);