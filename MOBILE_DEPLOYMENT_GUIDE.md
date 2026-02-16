# Deploying MRZ Scanner LWC to Salesforce Mobile App

This guide explains how to make the MRZ Scanner Lightning Web Component (LWC) available in the Salesforce Mobile App.

## Prerequisites

- MRZ Scanner LWC already deployed to your Salesforce org
- Admin access to Salesforce Setup
- Salesforce Mobile App installed on your device (iOS/Android)

---

## Step 1: Update the Component Meta XML

Update the `mrzScanner.js-meta.xml` file to include mobile-compatible targets:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<LightningComponentBundle xmlns="http://soap.sforce.com/2006/04/metadata">
    <apiVersion>59.0</apiVersion>
    <isExposed>true</isExposed>
    <targets>
        <target>lightning__AppPage</target>
        <target>lightning__RecordPage</target>
        <target>lightning__HomePage</target>
        <!-- Mobile targets -->
        <target>lightning__Tab</target>
        <target>lightningCommunity__Page</target>
        <target>lightningCommunity__Default</target>
    </targets>
</LightningComponentBundle>
```

Deploy this updated file to your org.

---

## Step 2: Create a Lightning Tab

1. Navigate to **Setup** (gear icon → Setup)
2. In the Quick Find box, search for **Tabs**
3. Click on **Tabs**
4. Under **Lightning Component Tabs**, click **New**
5. Select `c:mrzScanner` from the Lightning Component dropdown
6. Enter a **Tab Label** (e.g., "MRZ Scanner")
7. Choose a **Tab Style** (icon)
8. Click **Next**, then **Save**

---

## Step 3: Add Tab to Mobile Navigation

1. Go to **Setup**
2. In the Quick Find box, search for **Salesforce Mobile App**
3. Click **Salesforce Navigation** (under Mobile Apps)
4. Find your newly created tab in the **Available** list
5. Select it and click **Add** to move it to the **Selected** list
6. Use the **Up/Down** arrows to arrange the position in the navigation menu
7. Click **Save**

---

## Step 4: Test on Mobile Device

### iOS

1. Download the **Salesforce** app from the App Store
2. Log in with your Salesforce credentials
3. Tap the menu icon (hamburger menu)
4. Navigate to your MRZ Scanner tab

### Android

1. Download the **Salesforce** app from Google Play Store
2. Log in with your Salesforce credentials
3. Tap the menu icon (hamburger menu)
4. Navigate to your MRZ Scanner tab

---

## Mobile-Specific Considerations

### Camera Permissions

When first accessing the MRZ Scanner on mobile:

- The app will request camera permissions
- Ensure you **Allow** camera access when prompted
- If denied, you'll need to enable it in your device's Settings

### Responsive Design

For optimal mobile experience, consider adjusting the viewer height in `mrzScanner.html`:

```html
<div class="viewer" style="height:70vh;width:100%;min-height:400px;"></div>
```

This uses viewport height (`vh`) instead of fixed pixels for better mobile scaling.

---

## Troubleshooting

| Issue                           | Solution                                              |
| ------------------------------- | ----------------------------------------------------- |
| Tab not appearing in mobile app | Ensure the tab is added to Mobile Navigation in Setup |
| Camera not working              | Check camera permissions in device settings           |
| Scanner not loading             | Verify static resources are deployed correctly        |
| Blank screen                    | Check browser console for JavaScript errors           |

### Camera Access Issues

If the camera doesn't work in the mobile app:

1. **Check Device Permissions**: Go to your device Settings → Apps → Salesforce → Permissions → Enable Camera
2. **Re-deploy Static Resources**: Ensure the `mrzScannerResource` static resource is properly deployed
3. **Clear App Cache**: In the Salesforce mobile app, go to Settings → Clear Cache

---

## Alternative Deployment Options

### Option 1: Lightning App Page

1. Create a new Lightning App Page in App Builder
2. Drag your MRZ Scanner component onto the page
3. Save and Activate for both desktop and mobile

### Option 2: Add to Record Page

1. Edit a Record Page (e.g., Contact, Lead)
2. Add the MRZ Scanner component to the page
3. Save and Activate

### Option 3: Experience Cloud (Community)

If using Experience Cloud:

1. Open Experience Builder
2. Drag the MRZ Scanner component onto your page
3. Publish the site

---

## Support

For additional assistance, contact support with:

- Salesforce org ID
- Mobile device model and OS version
- Screenshots of any error messages
- Browser console logs (if available)
