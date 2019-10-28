const path = require("path");
const mdxCompiler = require("@storybook/addon-docs/mdx-compiler-plugin");

module.exports = async ({ config }) => {
    config.module.rules.push({
        test: /\.scss$/,
        loaders: ["style-loader", "css-loader", "sass-loader"],
        include: path.resolve(__dirname, "../")
    });
    config.module.rules.push({
        test: /\.css$/,
        loaders: ["style-loader", "css-loader"],
        include: path.resolve(__dirname, "stories")
    });
    config.module.rules.push({
        test: /\.tsx?$/,
        use: [
            {
                loader: "awesome-typescript-loader"
            }, {
                loader: "react-docgen-typescript-loader",
                options: {
                    tsconfigPath: path.resolve(__dirname, '../tsconfig.json')
                }
            }
        ],
        exclude: /node_modules/
    });
    config.module.rules.push({
        test: /\.stories\.mdx$/,
        use: [
            {
                loader: "babel-loader",
                options: {
                    presets: [
                        ["react-app", { flow: false, typescript: true }]
                    ]
                },
            },
            {
                loader: "@mdx-js/loader",
                options: {
                    compilers: [
                        mdxCompiler({})
                    ]
                }
            },
        ]
    });
    config.node = {
        fs: "empty",
        module: "empty"
    };
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
};
