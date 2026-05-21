import { $, browser } from "@wdio/globals";

class PipPage {
  public get openCameraButton() {
    return $("button=Open Camera");
  }
  public get togglePipButton() {
    return $("button=Toggle Picture-in-Picture");
  }
  public get playerContainer() {
    return $("#playerContainer");
  }
  public get player() {
    return $("#player");
  }
  public get video() {
    return $("#video");
  }
  public get autoPipCheckbox() {
    return $('input[type="checkbox"]');
  }

  public open() {
    return browser.url("/");
  }

  public async clickTogglePipButton() {
    await this.togglePipButton.click();
  }

  public async waitForCamera(timeout = 5000) {
    await browser.waitUntil(async () => await this.togglePipButton.isEnabled(), {
      timeout,
    });
  }
}

export default new PipPage();
