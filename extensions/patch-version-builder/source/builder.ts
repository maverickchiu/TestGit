import { BuildPlugin } from '../@types';
import { PACKAGE_NAME } from './global';

export const load: BuildPlugin.load = function() {
    console.debug(`${PACKAGE_NAME} load`);
};
export const unload: BuildPlugin.load = function() {
    console.debug(`${PACKAGE_NAME} unload`);
};

export const configs: BuildPlugin.Configs = {
    '*': {
        hooks: './hooks',
        doc: 'editor/publish/custom-build-plugin.html',
        options: {
            // remoteAddress: {
            //     label: `i18n:${PACKAGE_NAME}.options.remoteAddress`,
            //     default: 'http://192.168.165.43:8081',
            //     render: {
            //         ui: 'ui-input',
            //         attributes: {
            //             placeholder: 'Enter remote address...',
            //         },
            //     },
            //     verifyRules: ['required'],
            // },

            versionName: {
                label: `i18n:${PACKAGE_NAME}.options.versionName`,
                default: '1.2.12',
                render: {
                    ui: 'ui-input',
                    attributes: {
                        placeholder: 'Enter version name...',
                    },
                },
                verifyRules: ['required'],
            },
            buildCode: {
                label: `i18n:${PACKAGE_NAME}.options.buildCode`,
                default: 0,
                render: {
                    ui: 'ui-num-input',
                    attributes: {
                        step: 1,
                        min: 0,
                    },
                },
                verifyRules: ['required'],
            },
            environment: {
                label: `i18n:${PACKAGE_NAME}.options.environment`,
                description: `i18n:${PACKAGE_NAME}.options.environment`,
                default: 'development',
                render: {
                    ui: 'ui-select-pro',
                    items: [
                        {
                            label: `i18n:${PACKAGE_NAME}.options.environmentDevelopment`,
                            value: 'development',
                        },
                        {
                            label: `i18n:${PACKAGE_NAME}.options.environmentTest`,
                            value: 'test',
                        },
                        {
                            label: `i18n:${PACKAGE_NAME}.options.environmentProduction`,
                            value: 'production',
                        },
                    ],
                },
                verifyRules: ['required'],
            },
        },
        panel: './panel',
        verifyRuleMap: {
            ruleTest: {
                message: `i18n:${PACKAGE_NAME}.options.ruleTest_msg`,
                func(val, buildOptions) {
                    if (val === 'cocos') {
                        return true;
                    }
                    return false;
                },
            },
        },
    },
};

export const assetHandlers: BuildPlugin.AssetHandlers = './asset-handlers';
