# Dayline Planner

A static study planner (no build step). Plans, daily goals, goals, syllabus, timetable and calendar,
with reminders that repeat every hour until a plan is marked done.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole app (HTML, CSS, JS). Favicon is embedded. |
| `manifest.webmanifest` | Lets you install it to your home screen. |
| `sw.js` | Service worker: offline cache and notification fallback for phones. |
| `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App icons. |
| `vercel.json` | Headers for the service worker and manifest. |

## Deploy on Vercel

**Option A: Vercel CLI**

```bash
cd dayline-vercel
npx vercel --prod
```

When asked, accept the defaults. If it asks for a framework, choose **Other**; leave the build command and output directory empty.

**Option B: GitHub**

1. Push this folder to a new GitHub repository.
2. In Vercel choose **Add New > Project** and import the repository.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty. Deploy.

## Notes

- Notifications need HTTPS, which Vercel provides. Tap **Allow notifications** in the app when asked.
- Reminders fire while the app is open in a browser tab or installed app. There is no server, so nothing can fire after the app is fully closed.
- On iPhone, system notifications work only after you add the site to the Home Screen (iOS 16.4 or later).
- Data is saved in the browser (localStorage) on each device. It does not sync between devices.
- Fonts (Inter and Inter Tight) load from Google Fonts. If they are blocked, the app falls back to Helvetica or Arial.
- Example plans are loaded on first run. Use **Clear examples** in the Reminders panel to remove them.
