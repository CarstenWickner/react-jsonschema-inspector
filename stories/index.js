import React from 'react';
import { storiesOf } from '@storybook/react';
import { withInfo } from '@storybook/addon-info';

import Inspector from '../src/Inspector';

import personSchema from './schema-person.json';
import metaSchema from './schema-meta.json';
import shopSelectionSchema from './schema-show-selection.json';

storiesOf('Inspector', module)
    .addDecorator(withInfo({
        inline: true,
        header: false,
        maxPropsIntoLine: 1,
        maxPropArrayLength: 5,
        propTablesExclude: [Inspector]
    }))
    .add('standard', () => (
        <Inspector
            schemas={{
                "Person": personSchema
            }}
        />
    ))
    .add('with defaultSelectedItems', () => (
        <Inspector
            schemas={{
                "Person": personSchema,
                "Shop Selection": shopSelectionSchema
            }}
            defaultSelectedItems={["Shop Selection", "vegetables"]}
        />
    ))
    .add('with renderEmptyDetails prop', () => (
        <Inspector
            schemas={{
                "Meta JSON Schema": metaSchema
            }}
            renderEmptyDetails={schemas => {
                return (
                    <div style={{margin: "1em" }}>
                        <h4>JSON Schema Inspector</h4>
                        <p>
                            Just click on "{Object.keys(schemas)}" on the left side
                            in order to traverse its nested properties
                            – but beware of its circular references.
                        </p>
                    </div>
                );
            }}
        />
    ));   