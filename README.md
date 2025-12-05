# Building an MRZ Scanner Lightning Web Component in Salesforce

This guide walks through creating a Lightning Web Component (LWC) that integrates the Dynamsoft MRZ Scanner SDK to scan passports, ID cards, and other machine-readable zone documents directly within Salesforce.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Step-by-Step Implementation](#step-by-step-implementation)
  - [Step 1: Set Up Project Structure](#step-1-set-up-project-structure)
  - [Step 2: Create the Static Resource](#step-2-create-the-static-resource)
  - [Step 3: Create the Lightning Web Component](#step-3-create-the-lightning-web-component)
  - [Step 4: Deploy to Salesforce](#step-4-deploy-to-salesforce)
- [How It Works](#how-it-works)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Overview

The Dynamsoft MRZ Scanner SDK enables real-time scanning and parsing of Machine Readable Zones (MRZ) found on passports, ID cards, and visas. This implementation allows you to use the SDK within Salesforce Lightning Experience while respecting Salesforce's security policies.

**Key Features:**

- Scan MRZ from camera or uploaded images
- Parse MRZ data into structured fields (name, document number, date of birth, etc.)
- Display results directly in Salesforce
- Compliant with Lightning Web Security (LWS)

## Prerequisites

- Salesforce org with Lightning Web Components enabled
- Salesforce CLI (sf) installed
- A Dynamsoft license key ([Get a free trial license](https://www.dynamsoft.com/customer/license/trialLicense?product=mrz&deploymenttype=web))
- Basic knowledge of Lightning Web Components
- Node.js and npm (for development)

## Architecture Overview

### Why Use Static Resources?

Initially, we attempted to load the Dynamsoft MRZ Scanner SDK directly in the LWC JavaScript file. However, this approach failed due to **Lightning Web Security (LWS)** restrictions. LWS is Salesforce's security architecture that prevents third-party libraries from accessing the DOM directly or using certain JavaScript features.

**The Challenge:**

- The Dynamsoft SDK needs to create UI elements and append them to the document body
- LWS blocks direct DOM manipulation by third-party code
- Camera access requires specific permission configurations

**The Solution:**
We use a **Static Resource with an HTML page** that runs in an iframe. This approach:

1. Isolates the SDK from LWS restrictions
2. Allows the SDK full control over its own DOM context
3. Communicates with the parent LWC using the `postMessage` API
4. Enables camera permissions through iframe attributes

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Salesforce Lightning Experience                        │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Lightning Web Component (mrzScanner)              │ │
│  │                                                     │ │
│  │  - Loads Static Resource                           │ │
│  │  - Creates iframe with sandbox permissions         │ │
│  │  - Listens for postMessage events                  │ │
│  │  - Displays MRZ results                            │ │
│  └──────────────┬─────────────────────────────────────┘ │
│                 │                                        │
│                 │ postMessage                            │
│                 ▼                                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Iframe (Static Resource)                          │ │
│  │                                                     │ │
│  │  ┌───────────────────────────────────────────────┐ │ │
│  │  │  mrz-scanner.html                             │ │ │
│  │  │                                                │ │ │
│  │  │  - Dynamsoft MRZ Scanner SDK                  │ │ │
│  │  │  - Camera/File upload UI                      │ │ │
│  │  │  - MRZ scanning logic                         │ │ │
│  │  │  - Sends results via postMessage              │ │ │
│  │  └───────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Step-by-Step Implementation

### Step 1: Set Up Project Structure

Create the following directory structure in your Salesforce project:

```
salesforce/
├── lwc/
│   └── mrzScanner/
│       ├── mrzScanner.html
│       ├── mrzScanner.js
│       ├── mrzScanner.css
│       └── mrzScanner.js-meta.xml
└── staticresources/
    ├── mrzScannerResource/
    │   └── mrz-scanner.html
    └── mrzScannerResource.resource-meta.xml
```

### Step 2: Create the Static Resource

#### 2.1 Create the HTML Scanner Page

Create `staticresources/mrzScannerResource/mrz-scanner.html`:

```html
<!DOCTYPE html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MRZ Scanner</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: "Salesforce Sans", Arial, sans-serif;
    }
    .container {
      padding: 20px;
    }
    .btn {
      background-color: #0176d3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin-right: 10px;
    }
    .btn:hover {
      background-color: #014486;
    }
    .btn:disabled {
      background-color: #c9c9c9;
      cursor: not-allowed;
    }
    .error {
      color: #c23934;
      margin-top: 10px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/dynamsoft-mrz-scanner@3.0.4/dist/mrz-scanner.bundle.js"></script>
</head>
<html>
  <body>
    <div class="container">
      <h3>MRZ Scanner</h3>
      <div style="margin-bottom: 20px">
        <button id="cameraBtn" class="btn">Scan with Camera</button>
        <button id="uploadBtn" class="btn">Upload Image</button>
      </div>
      <input type="file" id="fileInput" accept="image/*,application/pdf" style="display: none" />
      <div id="error" class="error"></div>
    </div>

    <script>
      const fileInput = document.getElementById("fileInput");
      const cameraBtn = document.getElementById("cameraBtn");
      const uploadBtn = document.getElementById("uploadBtn");
      const errorDiv = document.getElementById("error");

      let mrzScanner;

      // Initialize the MRZ Scanner when page loads
      window.addEventListener("load", async () => {
        try {
          if (typeof Dynamsoft === "undefined") {
            throw new Error("Dynamsoft library not loaded");
          }

          // Initialize scanner with your license key
          mrzScanner = new Dynamsoft.MRZScanner({
            license: "YOUR_LICENSE_KEY_HERE",
            showResultView: false,
          });

          // Notify parent that scanner is ready
          window.parent.postMessage({ type: "MRZ_INITIALIZED" }, "*");
        } catch (error) {
          errorDiv.textContent = "Failed to initialize scanner: " + error.message;
          cameraBtn.disabled = true;
          uploadBtn.disabled = true;
        }
      });

      // Camera scan handler
      cameraBtn.addEventListener("click", async () => {
        try {
          cameraBtn.disabled = true;
          uploadBtn.disabled = true;
          errorDiv.textContent = "Starting camera...";

          const result = await mrzScanner.launch();

          if (result) {
            if (result.status && result.status.code === 1) {
              errorDiv.textContent = "Scan cancelled";
            } else if (result.data) {
              errorDiv.textContent = "";

              // Send only serializable data to parent
              window.parent.postMessage(
                {
                  type: "MRZ_RESULT",
                  data: {
                    mrzText: result.data.mrzText,
                    parsedMRZ: result.data.parsedMRZ,
                  },
                },
                "*"
              );
            } else {
              errorDiv.textContent = "No MRZ detected";
            }
          }
        } catch (error) {
          errorDiv.textContent = "Camera error: " + error.message;
        } finally {
          cameraBtn.disabled = false;
          uploadBtn.disabled = false;
        }
      });

      // File upload handler
      uploadBtn.addEventListener("click", () => {
        fileInput.click();
      });

      fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        cameraBtn.disabled = true;
        uploadBtn.disabled = true;
        errorDiv.textContent = "Processing...";

        try {
          const result = await mrzScanner.launch(file);
          errorDiv.textContent = "";

          if (result && result.data) {
            // Send only serializable data to parent
            window.parent.postMessage(
              {
                type: "MRZ_RESULT",
                data: {
                  mrzText: result.data.mrzText,
                  parsedMRZ: result.data.parsedMRZ,
                },
              },
              "*"
            );
          } else if (result && result.status && result.status.code === 1) {
            errorDiv.textContent = "";
          } else {
            errorDiv.textContent = "No MRZ detected in the image";
          }
        } catch (error) {
          errorDiv.textContent = "Scanner error: " + (error.message || "Unknown error");
        } finally {
          cameraBtn.disabled = false;
          uploadBtn.disabled = false;
          fileInput.value = "";
        }
      });
    </script>
  </body>
</html>
```

**Key Points:**

- Loads Dynamsoft MRZ Scanner SDK from CDN
- Provides both camera and file upload options
- Uses `postMessage` to communicate with parent LWC
- Only sends serializable data (no functions) to avoid cloning errors

#### 2.2 Create Static Resource Metadata

Create `staticresources/mrzScannerResource.resource-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/zip</contentType>
</StaticResource>
```

### Step 3: Create the Lightning Web Component

#### 3.1 Component Template (HTML)

Create `lwc/mrzScanner/mrzScanner.html`:

```html
<template>
  <lightning-card title="MRZ Scanner" icon-name="custom:custom14">
    <div class="slds-p-around_medium">
      <div class="viewer" lwc:dom="manual"></div>

      <template if:true="{mrzResult}">
        <div class="slds-box slds-theme_shade slds-m-top_medium">
          <div class="slds-text-heading_small slds-m-bottom_small">MRZ Result:</div>
          <pre class="result-text">{mrzResult}</pre>
        </div>
      </template>
    </div>
  </lightning-card>
</template>
```

**Key Points:**

- `lwc:dom="manual"` allows manual DOM manipulation for iframe injection
- Uses Lightning Design System (SLDS) for styling
- Displays MRZ result after scanning

#### 3.2 Component JavaScript

Create `lwc/mrzScanner/mrzScanner.js`:

```javascript
import { LightningElement } from "lwc";
import mrzScannerResource from "@salesforce/resourceUrl/mrzScannerResource";

export default class MrzScanner extends LightningElement {
  mrzResult = "";

  connectedCallback() {
    // Listen for messages from iframe
    window.addEventListener("message", this.handleMessage.bind(this));
  }

  renderedCallback() {
    // Create iframe only once
    const viewerDiv = this.template.querySelector(".viewer");
    if (viewerDiv && !viewerDiv.querySelector("iframe")) {
      this.createIframe(viewerDiv);
    }
  }

  createIframe(container) {
    const iframe = document.createElement("iframe");
    iframe.src = mrzScannerResource + "/mrz-scanner.html";
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";

    // Enable camera and microphone permissions
    iframe.setAttribute("allow", "camera *; microphone *");

    // Sandbox permissions for the iframe
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");

    container.appendChild(iframe);
  }

  handleMessage(event) {
    // Verify message is from our scanner
    if (event.data && event.data.type === "MRZ_RESULT") {
      console.log("Received MRZ result:", event.data.data);

      // Display the MRZ text
      if (event.data.data && event.data.data.mrzText) {
        this.mrzResult = event.data.data.mrzText;
      }
    } else if (event.data && event.data.type === "MRZ_INITIALIZED") {
      console.log("MRZ Scanner initialized");
    }
  }

  disconnectedCallback() {
    window.removeEventListener("message", this.handleMessage.bind(this));
  }
}
```

**Key Points:**

- Imports the static resource using `@salesforce/resourceUrl`
- Dynamically creates iframe with proper sandbox permissions
- `allow="camera *; microphone *"` enables camera access
- Listens for `postMessage` events from the iframe
- Updates the component when MRZ results are received

#### 3.3 Component CSS

Create `lwc/mrzScanner/mrzScanner.css`:

```css
.viewer {
  width: 100%;
  min-height: 600px;
}

.result-text {
  font-family: "Courier New", monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-size: 14px;
}
```

#### 3.4 Component Metadata

Create `lwc/mrzScanner/mrzScanner.js-meta.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__HomePage</target>
    </targets>
</LightningComponentBundle>
```

**Key Points:**

- `isExposed="true"` makes the component available in Lightning App Builder
- Targets allow placement on different page types

### Step 4: Deploy to Salesforce

#### 4.1 Package the Static Resource

The static resource must be packaged as a ZIP file:

```powershell
cd salesforce/staticresources
Compress-Archive -Path "mrzScannerResource\*" -DestinationPath "mrzScannerResource.resource" -Force
```

**Why ZIP format?**
Salesforce static resources with the `.resource` extension are actually ZIP files. This allows you to package multiple files (HTML, CSS, JS, images) into a single resource.

#### 4.2 Deploy to Salesforce

```powershell
cd salesforce
sf project deploy start --target-org myOrg --source-dir .
```

Or deploy specific components:

```powershell
# Deploy static resource only
sf project deploy start --target-org myOrg --source-dir staticresources

# Deploy LWC only
sf project deploy start --target-org myOrg --source-dir lwc
```

#### 4.3 Add Component to a Page

1. Navigate to any Lightning App page, Record page, or Home page
2. Click the **Setup** gear icon and select **Edit Page**
3. Drag the **MRZ Scanner** component from the component list to your page
4. Click **Save** and **Activate**

## How It Works

### Communication Flow

1. **Initialization:**

   - LWC loads and creates an iframe pointing to the static resource
   - Static resource HTML loads the Dynamsoft SDK
   - SDK initializes and sends `MRZ_INITIALIZED` message to parent

2. **Scanning:**

   - User clicks "Scan with Camera" or "Upload Image"
   - SDK processes the scan in the iframe context
   - Result is parsed and MRZ data extracted

3. **Result Handling:**
   - Iframe sends `MRZ_RESULT` message with serializable data only
   - LWC receives message via `postMessage` event listener
   - Result is displayed in the parent component

### Why This Architecture?

**Problem 1: Lightning Web Security (LWS)**

- LWS prevents third-party libraries from manipulating the DOM
- The Dynamsoft SDK needs to create UI elements dynamically
- **Solution:** Run SDK in an iframe with its own DOM context

**Problem 2: Camera Permissions**

- Salesforce restricts camera access for security
- Direct implementation would be blocked by Content Security Policy (CSP)
- **Solution:** Use iframe `allow` attribute to grant camera permissions

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Dynamsoft library not loaded"

**Symptoms:** Error message on component load

**Causes:**

- CDN is blocked by firewall
- Network connectivity issues
- Incorrect SDK version

**Solutions:**

- Verify CDN URL is accessible
- Check browser console for network errors
- Try downloading the SDK and hosting it in the static resource

#### Issue 2: Camera not working

**Symptoms:** Black screen or "Camera access denied"

**Causes:**

- Browser doesn't have camera permission
- HTTPS required (camera doesn't work on HTTP)
- Iframe doesn't have proper allow attribute

**Solutions:**

- Grant camera permission in browser settings
- Ensure Salesforce org uses HTTPS (production orgs do by default)
- Verify iframe has `allow="camera *; microphone *"`

### Deployment Script

Create a PowerShell script for easy redeployment:

```powershell
# deploy-mrz-scanner.ps1
param(
    [string]$OrgAlias = "myOrg"
)

Write-Host "Packaging static resource..." -ForegroundColor Cyan
cd staticresources
if (Test-Path "mrzScannerResource.resource") {
    Remove-Item "mrzScannerResource.resource" -Force
}
Compress-Archive -Path "mrzScannerResource\*" -DestinationPath "mrzScannerResource.resource" -Force

Write-Host "Deploying to Salesforce..." -ForegroundColor Cyan
cd ..
sf project deploy start --target-org $OrgAlias --source-dir .

Write-Host "Deployment complete!" -ForegroundColor Green
```

Usage:

```powershell
.\deploy-mrz-scanner.ps1 -OrgAlias myOrg
```

## License

Remember to replace `YOUR_LICENSE_KEY_HERE` in `mrz-scanner.html` with your actual Dynamsoft license key.

**Getting a License:**

1. Visit [Dynamsoft License Portal](https://www.dynamsoft.com/customer/license/trialLicense?product=mrz&deploymenttype=web)
2. Select "MRZ Scanner" and "Web" deployment type
3. Register for a 30-day trial license
4. Copy the license key and update the code

**License Format:**

```javascript
mrzScanner = new Dynamsoft.MRZScanner({
  license: "DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9",
});
```

## Advanced Customizations

### Customizing the UI

Modify `mrz-scanner.html` styles to match your branding:

```css
.btn {
  background-color: #your-brand-color;
  /* ... other styles */
}
```

## Conclusion

This implementation demonstrates how to integrate third-party JavaScript SDKs into Salesforce Lightning Web Components while respecting security constraints. The key takeaways:

1. **Use Static Resources for third-party libraries** that need DOM access
2. **Communicate via postMessage** between iframe and parent LWC
3. **Grant permissions via iframe attributes** for camera/microphone access
4. **Package static resources as ZIP files** before deployment
5. **Use showResultView: false** to skip SDK's built-in result view and display results directly in your component

This pattern can be applied to other SDKs like barcode scanners, document scanners, or any library that requires direct DOM manipulation.

## Resources

- [Dynamsoft MRZ Scanner Documentation](https://www.dynamsoft.com/mrz-scanner/docs/web/)
- [Salesforce Lightning Web Components Developer Guide](https://developer.salesforce.com/docs/component-library/documentation/en/lwc)
- [Lightning Web Security Documentation](https://developer.salesforce.com/docs/platform/lwc/guide/security-lwsec-intro.html)
- [Static Resources in Salesforce](https://developer.salesforce.com/docs/atlas.en-us.pages.meta/pages/pages_resources.htm)

---

**Author's Note:** This implementation was developed through iterative problem-solving, addressing LWS restrictions and camera permissions. The final architecture provides a stable, secure way to use the Dynamsoft MRZ Scanner in Salesforce with a streamlined user experience by bypassing the SDK's default result view.
