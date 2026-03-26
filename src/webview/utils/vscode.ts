
// Declare acquireVsCodeApi directly
declare function acquireVsCodeApi(): any;

interface WebviewApi<State> {
    postMessage(message: unknown): void;
    getState(): State | undefined;
    setState<T extends State>(newState: T): T;
}

/**
 * A utility wrapper around the acquireVsCodeApi() function.
 */
class VSCodeAPIWrapper {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;

  constructor() {
    if (typeof acquireVsCodeApi === "function") {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }

  public postMessage(message: unknown) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.log("VS Code API not available. Message not sent:", message);
    }
  }

  public getState(): unknown | undefined {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    } else {
      const state = localStorage.getItem("vscodeState");
      return state ? JSON.parse(state) : undefined;
    }
  }

  public setState<T extends unknown>(newState: T): T {
    if (this.vsCodeApi) {
      return this.vsCodeApi.setState(newState);
    } else {
      localStorage.setItem("vscodeState", JSON.stringify(newState));
      return newState;
    }
  }
}

export const vscode = new VSCodeAPIWrapper();
