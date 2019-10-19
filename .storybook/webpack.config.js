const path = require("path");

module.exports = async ({ config }) => {
    config.module.rules.push({
        test: /\.stories\.js$/,
        loader: require.resolve('@storybook/source-loader'),
        exclude: [/node_modules/],
        enforce: 'pre'
    });
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
                loader: "awesome-typescript-loader",
                options: {
                    configFile: "../tsconfig.json"
                }
            },
            {
                loader: "react-docgen-typescript-loader",
            }
        ],
        exclude: /node_modules/
    });
    config.resolve.extensions.push(".ts");
    config.resolve.extensions.push(".tsx");
    return config;
};
