import { LightningElement, track } from "lwc";
import documentScannerResource from "@salesforce/resourceUrl/documentScannerResource";

export default class DocumentScannerDesktop extends LightningElement {
  @track scanResult = "";
  @track statusMessage = "";
  @track isLoading = false;
  initialized = false;
  scannerFrame;

  get iframeUrl() {
    return documentScannerResource + "/document-scanner.html";
  }

  renderedCallback() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    this.scannerFrame = document.createElement("iframe");
    this.scannerFrame.src = this.iframeUrl;
    this.template.querySelector("div.viewer").appendChild(this.scannerFrame);
    this.scannerFrame.setAttribute("style", "height:100%;width:100%;border:1px solid #dddbda;border-radius:4px;");
    this.scannerFrame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-downloads allow-popups");
  }

  connectedCallback() {
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.handleMessage.bind(this));
  }

  handleMessage(event) {
    if (event.data && event.data.type === "DWT_INITIALIZED") {
      this.statusMessage = "Document Scanner ready";
      this.isLoading = false;
      console.log("Document Scanner Desktop initialized");
    } else if (event.data && event.data.type === "DWT_DEVICES_LOADED") {
      console.log("Scanners found:", event.data.devices);
    } else if (event.data && event.data.type === "DWT_SCAN_COMPLETE") {
      this.scanResult = `Scanned ${event.data.imageCount} image(s) successfully`;
      console.log("Scan completed:", event.data);
    } else if (event.data && event.data.type === "DWT_SAVE_COMPLETE") {
      this.scanResult = `Saved: ${event.data.filename}`;
      console.log("Save completed:", event.data);
    } else if (event.data && event.data.type === "DWT_ERROR") {
      this.statusMessage = `Error: ${event.data.message}`;
      console.error("DWT Error:", event.data.message);
    } else if (event.data && event.data.type === "DWT_STATUS") {
      this.statusMessage = event.data.message;
    } else if (event.data && event.data.type === "DWT_LOADING") {
      this.isLoading = event.data.loading;
    }
  }
}
