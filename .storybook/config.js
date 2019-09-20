import { addParameters, configure } from '@storybook/react';

addParameters({
    options: {
        name: "JSON Schema Inspector",
        url: "https://github.com/CarstenWickner/react-jsonschema-inspector",
        showAddonPanel: false,
        showSearchBox: false
    }
});

configure(require.context('../stories', true, /\.stories\.js$/), module);
