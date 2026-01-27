"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetHandlers = exports.configs = exports.unload = exports.load = void 0;
const global_1 = require("./global");
const load = function () {
    console.debug(`${global_1.PACKAGE_NAME} load`);
};
exports.load = load;
const unload = function () {
    console.debug(`${global_1.PACKAGE_NAME} unload`);
};
exports.unload = unload;
exports.configs = {
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
                label: `i18n:${global_1.PACKAGE_NAME}.options.versionName`,
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
                label: `i18n:${global_1.PACKAGE_NAME}.options.buildCode`,
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
                label: `i18n:${global_1.PACKAGE_NAME}.options.environment`,
                description: `i18n:${global_1.PACKAGE_NAME}.options.environment`,
                default: 'development',
                render: {
                    ui: 'ui-select-pro',
                    items: [
                        {
                            label: `i18n:${global_1.PACKAGE_NAME}.options.environmentDevelopment`,
                            value: 'development',
                        },
                        {
                            label: `i18n:${global_1.PACKAGE_NAME}.options.environmentTest`,
                            value: 'test',
                        },
                        {
                            label: `i18n:${global_1.PACKAGE_NAME}.options.environmentProduction`,
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
                message: `i18n:${global_1.PACKAGE_NAME}.options.ruleTest_msg`,
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
exports.assetHandlers = './asset-handlers';
