import { UserConfig, defineConfig as vitestDefineConfig } from 'vitest/config'
import { UserConfigExport } from 'vitest/config';
import { ResolvedConfig as VitestResolvedConfig } from 'vitest';


interface CucumberInlineConfig {
    glueCode?: string[];
}

export interface ResolvedConfig extends VitestResolvedConfig {
    cucumber: CucumberInlineConfig;
}

declare module 'vitest' {
    interface InlineConfig {
        /**
         * Options for Cucumber
         */
        cucumber?: CucumberInlineConfig;
    }
}

type VitestCucumberPluginUserConfigExport = UserConfig;

export function defineConfig(config: VitestCucumberPluginUserConfigExport): UserConfigExport {
    return vitestDefineConfig(
        {
            ...config,
            test: {
                ...config.test,
                forceRerunTriggers:
                    [
                        ...(config.test?.forceRerunTriggers ?? []),
                        ...(config.test?.cucumber?.glueCode ?? [])
                    ]
            }
        }
    );
}

