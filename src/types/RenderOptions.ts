export type RenderOptions = {
    groupTitle?: string;
    options?: Array<RenderOptions>;
    optionNameForIndex?: (indexes: Array<number>) => string | undefined;
};
