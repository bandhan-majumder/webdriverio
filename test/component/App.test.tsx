import { $, expect } from "@wdio/globals";
import { render, cleanup } from "@testing-library/react";
import App from "../../react/src/App";

//@ts-ignore
describe("App Component - Picture-in-Picture", () => {
  let requestWindowArgs: { width: number; height: number }[];
  let appendCalls: any[];
  let addEventListenerCalls: { event: string; handler: Function }[];
  //@ts-ignore
  beforeEach(() => {
    requestWindowArgs = [];
    appendCalls = [];
    addEventListenerCalls = [];

    const mockRequestWindow = async (options: {
      width: number;
      height: number;
    }) => {
      requestWindowArgs.push(options);
      return {
        document: {
          body: {
            append: (el: any) => {
              appendCalls.push(el);
            },
          },
        },
        addEventListener: (event: string, handler: Function) => {
          addEventListenerCalls.push({ event, handler });
        },
      };
    };

    Object.defineProperty(window, "documentPictureInPicture", {
      value: { requestWindow: mockRequestWindow },
      configurable: true,
      writable: true,
    });
  });
  //@ts-ignore
  afterEach(() => {
    cleanup();
    delete (window as any).documentPictureInPicture;
  });
  //@ts-ignore
  it("should render the PiP button", async () => {
    //@ts-ignore
    render(<App />);

    const button = await $("#pipButton");
    await expect(button).toBeExisting();
    await expect(button).toHaveText("Open Picture-in-Picture window");
  });
  //@ts-ignore
  it("should render the video element", async () => {
    render(<App />);

    const video = await $("#video");
    await expect(video).toBeExisting();
    await expect(video).toHaveAttribute(
      "src",
      "https://www.w3schools.com/tags/mov_bbb.mp4",
    );
  });
  //@ts-ignore
  it("should call requestWindow with correct dimensions on click", async () => {
    render(<App />);
    await (await $("#pipButton")).click();

    expect(requestWindowArgs).toHaveLength(1);
    expect(requestWindowArgs[0]).toEqual({ width: 500, height: 500 });
  });
  //@ts-ignore
  it("should move the player element into the PiP window", async () => {
    render(<App />);
    await (await $("#pipButton")).click();

    expect(appendCalls).toHaveLength(1);
    expect(appendCalls[0].id).toBe("player");
    expect(appendCalls[0].querySelector("#video")).not.toBeNull();
  });
  //@ts-ignore
  it("should register pagehide listener on PiP window", async () => {
    render(<App />);
    await (await $("#pipButton")).click();

    expect(addEventListenerCalls).toHaveLength(1);
    expect(addEventListenerCalls[0].event).toBe("pagehide");
    expect(typeof addEventListenerCalls[0].handler).toBe("function");
  });
  //@ts-ignore
  it("should restore player to container when PiP closes", async () => {
    render(<App />);
    await (await $("#pipButton")).click();

    const pagehideHandler = addEventListenerCalls[0].handler;
    pagehideHandler();

    const container = await $("#playerContainer");
    const player = await container.$("#player");
    await expect(player).toBeExisting();
  });
});
