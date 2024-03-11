const { When, Then }=globalThis.__helpers;

When('I press add', {/*FIXME : should require options by default*/ }, async function () {
    console.log('______ I press add');
});

Then('the result should be {int} on the screen', {/*FIXME : should require options by default*/ }, async function (int) {
    console.log('the result should be {int} on the screen');
    console.log({ int });
});



