module.exports = {
    plugins: [
        require("postcss-flexbugs-fixes"),
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("autoprefixer")({
            flexbox: "no-2009"
        })
    ]
};
