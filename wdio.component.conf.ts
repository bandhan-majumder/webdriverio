//@ts-ignore
export const config: WebdriverIO.Config = {
    runner: ['browser', {
        vite: {
            config: './react/vite.config.ts'
        }
    }],
    specs: ['./test/component/**/*.test.tsx'],
    capabilities: [{
        browserName: 'chrome'
    }],
    logLevel: 'info',
    waitforTimeout: 10000,
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
