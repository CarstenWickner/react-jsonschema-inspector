const path = require("path");

module.exports = {
    stories: ["../stories/**/*.stories.mdx"],
    addons: [
        {
            name: "@storybook/addon-postcss",
            options: {
                rule: { test: /\.css$/i },
                postcssLoaderOptions: {
                    implementation: require("postcss"),
                },
            },
        }, {
            name: "@storybook/addon-docs",
            options: {
                configureJSX: true,
                babelOptions: {
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                useBuiltIns: "entry",
                            },
                        ],
                    ],
                },
                sourceLoaderOptions: null,
                showRoots: true,
            },
        },
        "@storybook/addon-essentials"
    ],
    typescript: {
        check: true, // type-check stories during Storybook build
    },
    webpackFinal: async (config) => {
        config.module.rules.push({
            test: /\.scss$/,
            use: ["style-loader", "css-loader", "sass-loader"],
            include: path.resolve(__dirname, "../"),
        });
        return config;
    }
};
