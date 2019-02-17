import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import Inspector from '../src/Inspector';

import personSchema from './schema-person.json';
import metaSchema from './schema-meta.json';
import shopSelectionSchema from './schema-shop-selection.json';

storiesOf('Inspector', module)
    .addDecorator(withInfo({
        inline: true,
        header: false,
        maxPropsIntoLine: 1,
        maxPropArrayLength: 5,
        propTablesExclude: [Inspector]
    }))
    .add('minimal', () => (
        <Inspector
            schemas={{
                "Person": personSchema
            }}
        />
    ))
    .add('with empty Details', () => (
        <Inspector
            schemas={{
                "Meta JSON Schema": metaSchema
            }}
            renderEmptyDetails={({ rootColumnSchemas }) => {
                return (
                    <div style={{ "padding": "1em", "background-color": "#80cbc4" }}>
                        <h3>JSON Schema Inspector</h3>
                        <p>
                            Just click on "{Object.keys(rootColumnSchemas)}" on the left side
                            in order to traverse its nested properties
                            – but beware of its circular references.
                        </p>
                    </div>
                );
            }}
        />
    ))
    .add('with custom Details', () => (
        <Inspector
            schemas={{
                "Shop": shopSelectionSchema
            }}
            defaultSelectedItems={["Shop", "vegetables"]}
            renderSelectionDetails={({ itemSchema, columnData, selectionColumnIndex }) => {
                return (
                    <div style={{ "padding": "1em", "background-color": "#80cbc4" }}>
                        <h3>Custom Details</h3>
                        <p>
                            {itemSchema.description}
                        </p>
                        <h4>Selection Path</h4>
                        <code>
                            {'//' + columnData
                                .filter((column, index) => index <= selectionColumnIndex)
                                .map(column => column.selectedItem)
                                .join('/')}
                        </code>
                    </div>
                );
            }}
        />
    ))
    .add('with custom Items', () => (
        <Inspector
            schemas={{
                "Shop": shopSelectionSchema,
                "Meta JSON Schema": metaSchema
            }}
            defaultSelectedItems={["Meta JSON Schema"]}
            renderItemContent={({ name, hasNestedItems, selected, focused }) => {
                return (
                    <div
                        className="jsonschema-inspector-item-content"
                        style={{
                            "background-color": (focused ? "#005b4f" : (selected ? "#80cbc4" : "#80cbc4")),
                            "color": (focused ? "white" : "black")
                        }}>
                        <span className="jsonschema-inspector-item-name">{(hasNestedItems ? "\u25A0 " : "\u25A1 ") + name}</span>
                    </div>
                );
            }}
        />
    ));
