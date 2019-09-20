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
    return config;
};
