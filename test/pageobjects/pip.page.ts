import { $, browser } from '@wdio/globals'

class PipPage {
    public get pipButton() { return $('#pipButton') }
    public get playerContainer() { return $('#playerContainer') }
    public get player() { return $('#player') }
    public get video() { return $('#video') }

    public open() {
        return browser.url('/')
    }

    public async clickPipButton() {
        await this.pipButton.click()
    }
}

export default new PipPage()
