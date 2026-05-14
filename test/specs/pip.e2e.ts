import { browser, expect } from "@wdio/globals";
import PipPage from "../pageobjects/pip.page";

describe("Document Picture-in-Picture", () => {
  it("should open video in PiP window on click and restore on close", async () => {
    await PipPage.open();

    // skip test if browser doesn't support PiP
    const hasPip = await browser.execute(
      () => "documentPictureInPicture" in window,
    );
    if (!hasPip) {
      return;
    }

    const originalHandle = await browser.getWindowHandle();

    await PipPage.clickPipButton();

    // wait for PiP window to open
    await browser.waitUntil(async () => {
      const handles = await browser.getWindowHandles();
      return handles.length === 2;
    });

    await browser.pause(3000);

    // switch to PiP window
    const handles = await browser.getWindowHandles();
    const pipHandle = handles.find((h) => h !== originalHandle);
    await browser.switchToWindow(pipHandle!);

    await browser.pause(3000);

    // verify video exists in PiP window
    await expect(PipPage.video).toBeExisting();

    // close PiP window
    await browser.closeWindow();

    // switch back to main window
    await browser.switchToWindow(originalHandle);

    await browser.pause(3000);

    // verify player element is restored inside the container
    await expect(PipPage.player).toBeExisting();
    const containerHtml = await PipPage.playerContainer.getHTML();
    expect(containerHtml).toContain('id="player"');
  });
});
