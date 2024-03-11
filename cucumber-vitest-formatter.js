import { Formatter, formatterHelpers, Status } from '@cucumber/cucumber';
import { AssertionError } from 'assert';
import { it, suite } from 'vitest';
const { setFeature, setScenario, orderedDocuments, missingStep } = globalThis.__helpers;



export default class SimpleFormatter extends Formatter {

    scenarios = {};
    steps = {};
    testCases = {};
    testSteps = {};
    missingSteps = false;

    onGherkinDocument(gherkinDocument) {
        setFeature(`${gherkinDocument.feature.keyword}: ${gherkinDocument.feature.name}`);
    }
    onPickle(pickle) {
        this.scenarios[pickle.id] = {
            ...pickle
        }
        pickle.steps.forEach(step => {
            this.steps[step.id] = {
                ...step
            }
        });

        // pickle: {
        //     id: 'cc9eecf2-ab7c-4b6d-8f94-1f81b2a70c1f',
        //     uri: 'features/second.feature',
        //     astNodeIds: [ 'fd727b37-09ba-4d6f-a1ed-168f8d7352f2' ],
        //     tags: [],
        //     name: 'Adding two numbers together abacus',
        //     language: 'pt',
        //     steps: [
        //       {
        //         id: 'e0196a59-0d2b-4429-b883-33d069c141f2',
        //         text: 'I have entered 40 into the abacus',
        //         type: 'Context',
        //         argument: undefined,
        //         astNodeIds: [ '42911027-c426-4c83-8f1c-6ca98715612a' ]
        //       },
    }

    onTestCase(testCase) {
        this.testCases[testCase.id] = {
            ...testCase
        }
        testCase.testSteps.forEach(testStep => {
            this.testSteps[testStep.id] = {
                ...testStep
            }
        });

        // pickleId: '0d0c1c8d-640f-4ab9-94f7-f6c3cc9522e6',
        // id: '6fa54cd2-ae1f-40c4-9dbe-9a18ce469041',
        //     testSteps: [
        //       {
        //         id: '5d6c6fde-11a1-4a81-a04c-aefa5deae32e',
        //         pickleStepId: '0b085d94-5c61-4ef6-8c41-ba9cb472b2e2',
        //         stepDefinitionIds: [ '135aa51f-ccf1-4270-9398-b4c83478e398' ], 
        //>>>>>> connects to stepDefinition.id
        //         stepMatchArgumentsLists: [
        //           {
        //             stepMatchArguments: [
        //               {
        //                 group: { start: 15, value: '50', children: [] },
        //                 parameterTypeName: 'int'
        //               }
        //             ]
        //           }
        //         ]
        //       },
    }
    onTestCaseStarted(testCaseStarted) {
        const pickleId = this.testCases[testCaseStarted.testCaseId].pickleId;
        const scenarioName = this.scenarios[pickleId].name;
        setScenario(scenarioName);
    }
    onTestStepFinished(testStepFinished) {
        if (testStepFinished.testStepResult.status === "UNDEFINED") {
            const testStepId = testStepFinished.testStepId;
            const pickleStepId = this.testSteps[testStepId].pickleStepId;
            const pickleStep = this.steps[pickleStepId];

            const snip = this.snippetBuilder.build(
                {
                    keywordType: "event",
                    pickleStep
                }
            );

            missingStep(pickleStep.text, snip);
            this.missingSteps = false;
        }
    }

    onTestRunFinished(testRunFinished) {
        for (const feature of orderedDocuments) {
            suite(feature.name, () => {
                for (const scenario of feature.scenarios) {
                    suite(scenario.name, () => {
                        for (const step of scenario.steps) {
                            it(step.pattern, async (...args) => {                                
                                await step.userCode(args);
                            });
                        }
                    });
                }
            });
        }

        if (this.missingSteps) {
            const snippets = [];
            this.eventDataCollector.getTestCaseAttempts().forEach((testCaseAttempt) => {
                const parsed = formatterHelpers.parseTestCaseAttempt({
                    snippetBuilder: this.snippetBuilder,
                    supportCodeLibrary: this.supportCodeLibrary,
                    testCaseAttempt,
                })
                parsed.testSteps.forEach((testStep) => {
                    if (
                        testStep.result.status === 'UNDEFINED'
                    ) {
                        snippets.push(testStep.snippet)
                    }
                })
            })
            console.log(snippets.join('\n\n'))
        }
    }

    constructor(options) {
        super(options);

        options.eventBroadcaster.on('envelope', (envelope) => {

            // console.dir({ envelope }, { depth: 20 });

            if (envelope.gherkinDocument) {
                this.onGherkinDocument(envelope.gherkinDocument)
            }
            //envelope<pickle> is a scenario with => pickle.id
            else if (envelope.pickle) {
                this.onPickle(envelope.pickle);
            }
            //envelope<testCase> has id and pickleId => scenario 
            else if (envelope.testCase) {
                this.onTestCase(envelope.testCase);
            }
            //envelope<testCaseStarted> has testcaseId => testCase.id
            //THEN we have test steps ;)
            else if (envelope.testCaseStarted) {
                this.onTestCaseStarted(envelope.testCaseStarted);
            }
            else if (envelope.testStepFinished) {
                this.onTestStepFinished(envelope.testStepFinished);
            }
            else if (envelope.testRunFinished) {
                this.onTestRunFinished(envelope.testRunFinished);
            }
            else if (envelope.testCaseAttempt) {
                console.log({ envelope });
            }

        })
    }

    logTestCaseFinished(testCaseFinished) {
        const testCaseAttempt = this.eventDataCollector.getTestCaseAttempt(testCaseFinished.testCaseStartedId)
        //this.log(testCaseAttempt.gherkinDocument.feature.name + ' / ' + testCaseAttempt.pickle.name + '\n')
        // console.dir({ testCaseFinished }, { depth: 10 });
        const parsed = formatterHelpers.parseTestCaseAttempt({
            cwd: this.cwd,
            snippetBuilder: this.snippetBuilder,
            supportCodeLibrary: this.supportCodeLibrary,
            testCaseAttempt
        })
        parsed.testSteps.forEach(testStep => {

            const currentStatus = Status[testStep.result.status];
            const testStepException = testStep.result.exception;

            //console.dir({ testStep }, { depth: 10 });


            this.scenarioSuiteCollector.task(
                testStep.keyword + (testStep.text || ''),
                {
                    skip: currentStatus === Status.SKIPPED,
                    retry: 0,
                    todo: currentStatus === Status.UNDEFINED || currentStatus === Status.PENDING || currentStatus === Status.UNKNOWN,
                    timeout: 0,
                    concurrent: false,
                    fails: false,
                    handler: () => {
                        if (currentStatus === Status.FAILED) {
                            if (testStepException) {
                                //console.error("testStepException", { testStepException });
                                if (testStepException.type === "AssertionError") {
                                    const assertError = new AssertionError(
                                        {
                                            message: testStepException.message,
                                        });
                                    assertError.stack = testStepException.stackTrace;
                                    throw assertError;
                                } else {
                                    const error = new Error(
                                        {
                                            message: testStepException.message,
                                        });
                                    error.stack = testStepException.stackTrace;
                                    throw error;
                                }
                            }
                        }
                    },
                    meta: {
                        step: `${testStep.keyword} ${testStep.text}`
                    },
                    repeats: 0,
                }
            );
            //Status[testStep.result.status]!=Status.PASSED

            //because test() call above adds the scenario to the current external top level, suite, we need to remove it... :(
            // getCurrentSuite().tasks.pop();           
        })
    }

}