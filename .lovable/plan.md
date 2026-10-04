# EarnGage image management

## What will change
- Add a separate `/manage` page where the promotional image can be replaced.
- Store the selected image so the Share & Earn page uses the latest version across devices.
- Use the uploaded EarnGage artwork for the header logo and browser icon.
- Keep the existing download and Facebook-share experience.

## Technical details
- Enable Lovable Cloud storage for persistent image uploads.
- Add an upload control with preview, file validation, save progress, and success/error feedback.
- Read the current promotional image on the main page, with the existing image as a fallback.
- Add route-specific page metadata and verify desktop/mobile rendering.
