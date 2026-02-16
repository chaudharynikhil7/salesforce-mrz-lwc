import { LightningElement, track } from "lwc";
import barcodeScannerResource from "@salesforce/resourceUrl/barcodeScannerResource";

export default class BarcodeScanner extends LightningElement {
  @track barcodeResult = "";
  initialized = false;
  barcodeFrame;

  get iframeUrl() {
    return barcodeScannerResource + "/barcode-scanner.html";
  }

  renderedCallback() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.barcodeFrame = document.createElement("iframe");
    this.barcodeFrame.src = this.iframeUrl;
    this.template.querySelector("div.viewer").appendChild(this.barcodeFrame);
    this.barcodeFrame.setAttribute("style", "height:100%;width:100%;border:1px solid #dddbda;border-radius:4px;");
    this.barcodeFrame.setAttribute("allow", "camera *; microphone *");
    this.barcodeFrame.setAttribute("sandbox", "allow-scripts allow-same-origin");
  }

  connectedCallback() {
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.handleMessage.bind(this));
  }

  handleMessage(event) {
    if (event.data && event.data.type === "BARCODE_RESULT") {
      this.barcodeResult = JSON.stringify(event.data.data, null, 2);
      console.log("Barcode Result received:", event.data.data);
    } else if (event.data && event.data.type === "BARCODE_INITIALIZED") {
      console.log("Barcode Scanner initialized");
    }
  }
}
