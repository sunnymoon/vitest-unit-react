//import { Given } from '../../cucumber-helpers'
import { expect, suite, test } from 'vitest';

const { Given } = globalThis.__helpers;

Given('I have entered {int} into the calculator', {/*FIXME : should require options by default*/ }, async function (int) {
    expect(true).toBe(true);
    console.log('I have entered {int} into the calculator');
    console.log({ int });        
    
    return 'pending';
});

Given('I have entered {int} secondly into the calculator', {/*FIXME : should require options by default*/ }, async function (int) {
    console.log('I have entered {int} secondly into the calculator');
    console.log({ int });

    await new Promise((resolve) => setTimeout(resolve, 1000));
});