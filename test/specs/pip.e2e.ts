import { browser, expect } from "@wdio/globals";
import PipPage from "../pageobjects/pip.page";

describe("Document Picture-in-Picture", () => {
  it("should open video in PiP window on click and restore on close", async () => {
    await PipPage.open();

    const hasPip = await browser.execute(
      () => "documentPictureInPicture" in window,
    );
    if (!hasPip) return;

    const originalHandle = await browser.getWindowHandle();

    await PipPage.waitForCamera();
    await PipPage.clickTogglePipButton();

    await browser.waitUntil(async () => {
      const handles = await browser.getWindowHandles();
      return handles.length === 2;
    });

    await browser.pause(1200);

    const handles = await browser.getWindowHandles();
    const pipHandle = handles.find((h) => h !== originalHandle);
    await browser.switchToWindow(pipHandle!);

    await browser.pause(1200);
    await expect(PipPage.video).toBeExisting();

    await browser.closeWindow();
    await browser.switchToWindow(originalHandle);

    await browser.pause(1200);
    await expect(PipPage.player).toBeExisting();
    const containerHtml = await PipPage.playerContainer.getHTML();
    expect(containerHtml).toContain('id="player"');
  });
});
