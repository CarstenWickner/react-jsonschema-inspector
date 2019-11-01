export type SchemaPartParserConfig = {
    /**
     * Optional title to show above multiple parts in a given wrapper (e.g. "anyOf"/"oneOf").
     */
    groupTitle?: string;
    /**
     * Supplier for an alternative name to be displayed (default is: (indexes) => `Option ${indexes.joining('.')}`).
     */
    optionNameForIndex?: (indexes: Array<number>) => string | undefined;
};

export type ParserConfig = {
    /**
     * Setting indicating how to include schema parts wrapped in "anyOf".
     */
    anyOf?: SchemaPartParserConfig;
    /**
     * Setting indicating how to include schema parts wrapped in "oneOf".
     */
    oneOf?: SchemaPartParserConfig;
};
