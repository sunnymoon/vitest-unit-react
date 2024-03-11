import path from 'path';
import fg from 'fast-glob';


import { ResolvedConfig } from './vitest-cucumber-plugin'
import { Suite, Task, test } from 'vitest';
import { VitestRunner, VitestRunnerImportSource, CancelReason } from '@vitest/runner';
import { VitestExecutor } from 'vitest/execute';

import { loadConfiguration, runCucumber } from '@cucumber/cucumber/api';
import { IdGenerator } from '@cucumber/messages';
import { supportCodeLibraryBuilder } from '@cucumber/cucumber';
import { SupportCodeLibrary } from '@cucumber/cucumber/lib/support_code_library_builder/types';

globalThis.__helpers = await import('./cucumber-helpers');

export default class CucumberRunner implements VitestRunner {

    private __vitest_executor!: VitestExecutor

    public config: ResolvedConfig;

    private firstRun = true;

    private supportCode: SupportCodeLibrary;

    private cucumberConfig;

    constructor(config: ResolvedConfig) {
        this.config = config;
        this.cucumberConfig = {
            glueCode: this.config.cucumber?.glueCode ?? ["features/step_definitions/*.ts"]
        };
    }

    async importFile(filepath: string, source: VitestRunnerImportSource): Promise<unknown> {
        // console.log("importFile", filepath, source)
        if (source === 'collect') {


            const glueCodeFiles = await fg(this.cucumberConfig.glueCode, {
                absolute: true,
                onlyFiles: true
            });
            const foundInGlues = glueCodeFiles.find((file) => {
                return file === filepath;
            });
            // if (foundInGlues) {
            //     test(`Cucumber Glue Code Only... Please Ignore this message...`, async () => { });
            //     return {};
            // }



            const { runConfiguration } = await loadConfiguration({
                file: false,
                profiles: [],
                provided: {
                    parallel: 0,
                    format: [
                        './cucumber-vitest-formatter.js'
                    ],
                    formatOptions: {
                        "snippetInterface": "async-await"
                    },
                    paths: [filepath],
                    forceExit: false,
                    failFast: false,
                    import: [],
                    require: [],
                    requireModule: [],
                    dryRun: false,
                    order: 'defined',
                    backtrace: true,
                    language: 'en',
                    name: [],
                    publish: false,
                    retry: 0,
                    strict: false,
                    retryTagFilter: '',
                    tags: '',
                    worldParameters: {},
                }
            });

            if (this.firstRun) {
                this.firstRun = false;

                supportCodeLibraryBuilder.reset(
                    process.cwd(),
                    IdGenerator.uuid(),
                    {
                        importPaths: [],
                        requireModules: [],
                        requirePaths: [],
                    }
                );

                await Promise.all(
                    (await fg(this.cucumberConfig.glueCode, {
                        absolute: true,
                        onlyFiles: true
                    }))
                        .map(
                            async (importMatch) => {
                                if (path.extname(importMatch) !== '.feature') {
                                    await this.__vitest_executor.executeId(importMatch);
                                }
                            }
                        )
                );

                this.supportCode = supportCodeLibraryBuilder.finalize();
            }

            const { success } = await runCucumber({
                ...runConfiguration,
                support: this.supportCode
            });
        }

        return {};

    }

    onBeforeRunFiles(): void {
        // console.log("onBeforeRunFiles")
    }

    async onBeforeRunSuite(suite: Suite): Promise<void> {
        //  console.log("onBeforeRunSuite", suite);
    }

    async onAfterRunSuite(suite: Suite): Promise<void> {
        //  console.log("onAfterRunSuite", suite);
    }
    onAfterRunTask(test: Task): void {
        //  console.log("onAfterRunTask", test);
    }
    onCancel(_reason: CancelReason): void {
        //  console.log("onCancel", _reason);
    }
    async onBeforeRunTask(test: Task): Promise<void> {
        //  console.log("onBeforeRunTask", test);
    }

    onBeforeTryTask(test: Task): void {
        //  console.log("onBeforeTryTask", test);
    }
    onAfterTryTask(test: Task): void {
        //  console.log("onAfterTryTask", test);
    }

}

