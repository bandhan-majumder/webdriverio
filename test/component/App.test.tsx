import { $, expect, browser } from "@wdio/globals";
import { render, cleanup } from "@testing-library/react";
import App from "../../react/src/App";

describe("App Component - Picture-in-Picture", () => {
  let requestWindowCalls: { width: number; height: number }[];
  let mockPipWindow: any;

  beforeEach(() => {
    requestWindowCalls = [];

    mockPipWindow = {
      document: {
        head: { appendChild: () => {} },
        body: { style: {}, appendChild: () => {} },
      },
      addEventListener: () => {},
      close: () => { mockPipWindow.closed = true; },
      closed: false,
    };

    Object.defineProperty(window, "documentPictureInPicture", {
      value: {
        requestWindow: async (options: { width: number; height: number }) => {
          requestWindowCalls.push(options);
          return mockPipWindow;
        },
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    cleanup();
    delete (window as any).documentPictureInPicture;
    delete (document as any).hidden;
  });

  it("should render video, buttons, and autoPiP checkbox", async () => {
    render(<App />);

    await expect($("#video")).toBeExisting();
    await expect($("button=Open Camera")).toBeExisting();
    await expect($("button=Toggle Picture-in-Picture")).toBeExisting();
    await expect($('input[type="checkbox"]')).toBeExisting();
  });

  it("should auto-start camera on mount and enable PiP controls", async () => {
    render(<App />);

    await browser.waitUntil(
      async () => await $("button=Toggle Picture-in-Picture").isEnabled(),
    );
    await expect($("button=Open Camera")).toBeDisabled();
    await expect($("input[type='checkbox']")).toBeEnabled();
  });

  it("should open PiP window with correct dimensions on toggle click", async () => {
    render(<App />);

    await browser.waitUntil(
      async () => await $("button=Toggle Picture-in-Picture").isEnabled(),
    );

    await (await $("button=Toggle Picture-in-Picture")).click();
    expect(requestWindowCalls).toHaveLength(1);
    expect(requestWindowCalls[0]).toEqual({ width: 500, height: 500 });
  });

  it("should toggle autoPiP checkbox on click", async () => {
    render(<App />);

    await browser.waitUntil(
      async () => await $("button=Toggle Picture-in-Picture").isEnabled(),
    );

    const checkbox = await $('input[type="checkbox"]');
    await expect(checkbox).toBeChecked();

    await checkbox.click();
    await expect(checkbox).not.toBeChecked();

    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });
});
