import {
    Given as CukesGiven,
    When as CukesWhen,
    Then as CukesThen,
    BeforeStep as CukesBeforeStep,
    AfterStep as CukesAfterStep,
    Before as CukesBefore,
    After as CukesAfter,
    BeforeAll as CukesBeforeAll,
    AfterAll as CukesAfterAll,
    IWorld,
} from '@cucumber/cucumber';
import { DefineStepPattern, IDefineStep, IDefineStepOptions, IDefineTestCaseHookOptions, IDefineTestRunHookOptions, IDefineTestStepHookOptions, TestCaseHookFunction, TestRunHookFunction, TestStepFunction, TestStepHookFunction } from "@cucumber/cucumber/lib/support_code_library_builder/types";


// eslint-disable-next-line @typescript-eslint/ban-types
type Step<WorldType> = { pattern: DefineStepPattern, todo?: boolean, skip?: boolean, userCode?: TestStepFunction<WorldType> }
type Scenario<WorldType> = { name: string, steps: Step<WorldType>[] };
type Feature<WorldType> = { name: string, scenarios: Scenario<WorldType> [] };
export const orderedDocuments: Feature<IWorld>[] = [];

export const setFeature = (name: string) => {
    orderedDocuments.push( {
        name,
        scenarios: []
    } );
}

export const setScenario = (name: string) => {
    orderedDocuments[orderedDocuments.length - 1].scenarios.push({
        name,
        steps: []
    });
}

class PendingStepImplementationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PendingStepImplementationError';
    }
}

const StepCollector = (cukesCollectorFn: IDefineStep) => {

    return <WorldType = IWorld>(
        pattern: DefineStepPattern,
        options: IDefineStepOptions,
        code: TestStepFunction<WorldType>
    ): void => {
        //remember the original step code! 
        const realUserCodeFn = code;

        const cukeMakeBelieveStep= (...args) => {
            const theArgs = args;
             const newStep = {
                pattern,
                userCode: async (context) => {
                    const retVal=await realUserCodeFn.apply(cukesCollectorFn, theArgs);
                    if(retVal === 'pending' ) {
                                    
                        throw new PendingStepImplementationError(`Pending step '${pattern}' @ ${realUserCodeFn.toString()}`);
                    }
                }
            };
            const currentDocument = orderedDocuments[orderedDocuments.length - 1];
            const currentScenario = currentDocument.scenarios[currentDocument.scenarios.length - 1];
            currentScenario.steps.push(newStep);
        };
        //DON'T ASK!!!!!
        Object.defineProperty(cukeMakeBelieveStep, "length", { value: realUserCodeFn.length });

        cukesCollectorFn(
            pattern,
            options,
            cukeMakeBelieveStep
        );

    };

};

export const missingStep=(pattern: string, suggestSnippet: string) => {
    const newStep = {
        pattern,
        todo: true,
        userCode: () => {
            throw new Error(`Step not implemented: '${pattern}'\n\nSugested Code:\n\n${suggestSnippet}`);
        }
    };
    const currentDocument = orderedDocuments[orderedDocuments.length - 1];
    const currentScenario = currentDocument.scenarios[currentDocument.scenarios.length - 1];
    currentScenario.steps.push(newStep);
}

export const Given = StepCollector(CukesGiven);
export const When = StepCollector(CukesWhen);
export const Then = StepCollector(CukesThen);


type HookStepType = (<WorldType = IWorld>(code: TestStepHookFunction<WorldType>) => void)
    & (<WorldType = IWorld>(tags: string, code: TestStepHookFunction<WorldType>) => void)
    & (<WorldType = IWorld>(options: IDefineTestStepHookOptions, code: TestStepHookFunction<WorldType>) => void);
const HookStepCollector = (hooksCollectorFn: HookStepType) => {
    return hooksCollectorFn
};

type HookTestCaseType =
    (<WorldType = IWorld>(code: TestCaseHookFunction<WorldType>) => void)
    & (<WorldType = IWorld>(tags: string, code: TestCaseHookFunction<WorldType>) => void)
    & (<WorldType = IWorld>(options: IDefineTestCaseHookOptions, code: TestCaseHookFunction<WorldType>) => void);
const HookTestCaseCollector = (hooksCollectorFn: HookTestCaseType) => {
    return hooksCollectorFn;
}

type HookRunType = ((code: TestRunHookFunction) => void)
    & ((options: IDefineTestRunHookOptions, code: TestRunHookFunction) => void);
const HookRunCollector = (hooksCollectorFn: HookRunType) => {
    return hooksCollectorFn;
}


export const BeforeStep = HookStepCollector(CukesBeforeStep);
export const AfterStep = HookStepCollector(CukesAfterStep);
export const Before = HookTestCaseCollector(CukesBefore);
export const After = HookTestCaseCollector(CukesAfter);
export const BeforeAll = HookRunCollector(CukesBeforeAll);
export const AfterAll = HookRunCollector(CukesAfterAll);