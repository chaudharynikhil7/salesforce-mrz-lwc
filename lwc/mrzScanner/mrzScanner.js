import { LightningElement, track } from "lwc";
import mrzScannerResource from "@salesforce/resourceUrl/mrzScannerResource";

export default class MrzScanner extends LightningElement {
  @track mrzResult = "";
  initialized = false;
  mrzFrame;

  get iframeUrl() {
    return mrzScannerResource + "/mrz-scanner.html";
  }

  renderedCallback() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.mrzFrame = document.createElement("iframe");
    this.mrzFrame.src = this.iframeUrl;
    this.template.querySelector("div.viewer").appendChild(this.mrzFrame);
    this.mrzFrame.setAttribute("style", "height:100%;width:100%;border:1px solid #dddbda;border-radius:4px;");
    this.mrzFrame.setAttribute("allow", "camera *; microphone *");
    this.mrzFrame.setAttribute("sandbox", "allow-scripts allow-same-origin");
  }

  connectedCallback() {
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.handleMessage.bind(this));
  }

  handleMessage(event) {
    if (event.data && event.data.type === "MRZ_RESULT") {
      this.mrzResult = JSON.stringify(event.data.data, null, 2);
      console.log("MRZ Result received:", event.data.data);
    } else if (event.data && event.data.type === "MRZ_INITIALIZED") {
      console.log("MRZ Scanner initialized");
    }
  }
}
