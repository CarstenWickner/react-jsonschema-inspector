import { addParameters, configure } from '@storybook/react';
import { DocsPage, DocsContainer } from '@storybook/addon-docs/blocks';

addParameters({
    options: {
        name: "JSON Schema Inspector",
        url: "https://github.com/CarstenWickner/react-jsonschema-inspector",
        showAddonPanel: false,
        showSearchBox: false,
        // sort sub-folders to the bottom alphabetically – but leave the individual stories in their order of declaration
        storySort: (a, b) => a[1].id.substring(0, a[1].id.indexOf("--")).localeCompare(b[1].id.substring(0, b[1].id.indexOf("--")))
    },
    docs: {
      container: DocsContainer,
      page: DocsPage,
    }
});

configure(require.context('../stories', true, /\.stories\.js$/), module);
