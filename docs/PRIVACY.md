# Privacy Policy - SimplyCodes AI Shopping Partner

Last Updated: February 2024

## Our Privacy Commitment

SimplyCodes is built with a **privacy-first** philosophy. We believe you should be able to save money online without sacrificing your privacy. That's why all AI processing happens locally on your device.

## Key Privacy Features

### 🔒 Local Processing Only
- All AI models run directly in your browser
- No cloud servers process your data
- Your browsing history never leaves your device
- Product searches and chat conversations stay private

### 🚫 No Personal Data Collection
We do NOT collect:
- Personal identification information
- Browsing history or habits  
- Purchase history
- Search queries
- Chat conversations
- Location data
- Device identifiers

### 🔐 What Data Is Used

**Locally Processed (Never Sent):**
- Current page URL (for site detection)
- Product prices (for savings calculation)
- Cart totals (for coupon ranking)
- Your chat messages (for AI responses)

**Anonymized Data Sent:**
- Merchant domain hash (e.g., `a94a8fe5` instead of `amazon.com`)
- Used only to retrieve relevant coupon codes
- Cannot be traced back to specific sites or users

## Technical Implementation

### WebGPU/WASM Isolation
- AI models run in sandboxed environments
- No access to other browser tabs or data
- Memory is cleared when extension is closed

### Storage
- Models cached locally for performance
- Settings stored in browser's local storage
- No cookies or tracking pixels used
- All storage can be cleared via browser settings

### Network Requests
- Only anonymized merchant hashes sent
- All requests use HTTPS encryption
- No third-party services or analytics
- No CDN tracking or telemetry

## Data Flow Diagram

```
Your Browser (Local Only)
├── Page Analysis ──────┐
├── Price Detection     ├─→ AI Processing → Coupon Ranking
├── Chat Interface      │   (100% Local)
└── Coupon Application ─┘
           │
           ▼
    Merchant Hash Only
    (Anonymized Request)
           │
           ▼
    Mock Coupon Database
    (No User Data Stored)
```

## Your Rights

### You Can:
- ✅ Use the extension without creating an account
- ✅ Clear all local data at any time
- ✅ Disable the extension on specific sites
- ✅ Uninstall completely with no data retained
- ✅ Inspect our source code (open source)

### We Cannot:
- ❌ Track your browsing across sites
- ❌ Build a profile of your shopping habits
- ❌ Share or sell any data (we don't have any!)
- ❌ Identify you as an individual user
- ❌ Access your purchase history

## Security Measures

1. **Content Security Policy**: Strict CSP prevents code injection
2. **Manifest V3**: Uses Google's latest security standards
3. **Minimal Permissions**: Only requests necessary browser APIs
4. **Open Source**: Code is publicly auditable on GitHub

## Children's Privacy

SimplyCodes does not knowingly collect any information from children under 13. The extension is designed for general consumer use.

## Changes to Privacy Policy

Any changes to this privacy policy will be:
- Posted in the extension update notes
- Reflected in the "Last Updated" date above
- Communicated through our GitHub repository

## Third-Party Services

SimplyCodes does NOT use:
- Google Analytics or any analytics service
- Facebook Pixel or social media tracking  
- Third-party advertising networks
- External AI or ML APIs
- Cloud storage services

## Data Breach Response

In the unlikely event of a security issue:
- No user data exists to be breached
- We would immediately patch any vulnerabilities
- Updates would be pushed through Chrome Web Store
- Full disclosure on our GitHub repository

## Contact

For privacy questions or concerns:
- Open an issue on our GitHub repository
- Email: privacy@simplycodes.example.com

## Compliance

SimplyCodes is designed to respect:
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- COPPA (Children's Online Privacy Protection Act)
- Browser extension best practices

## Summary

**Your privacy is protected by design.** SimplyCodes proves that useful AI features don't require sacrificing user privacy. Everything happens locally in your browser, and we can't track, profile, or identify you in any way.

---

*This privacy policy is part of our commitment to transparency. The full source code is available for review on GitHub.*