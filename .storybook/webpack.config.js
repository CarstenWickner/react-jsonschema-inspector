const path = require("path");
const mdxCompiler = require('@storybook/addon-docs/mdx-compiler-plugin');

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
            },
            {
                loader: "react-docgen-typescript-loader"
            }
        ],
        exclude: /node_modules/
    });
    config.module.rules.push({
        test: /\.stories\.mdx$/,
        use: [
            {
                loader: 'babel-loader',
                options: {
                    plugins: ['@babel/plugin-transform-react-jsx'],
                },
            },
            {
                loader: '@mdx-js/loader',
                options: {
                    compilers: [
                        mdxCompiler({})
                    ]
                }
            },
        ]
    });
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
};
