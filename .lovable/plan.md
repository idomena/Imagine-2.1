## Goal
Connect the existing design to your own backend only, fix Google login, and make the Analytics dashboard use live backend data instead of generated demo numbers.

## Current problem
- The screenshot warning `GOOGLE_WEB_RISK_API_KEY is not set` is not the Google login issue. It only disables URL threat scanning in your backend.
- The frontend is configured for `https://api.imaginehq.services`, but that public domain currently returns Railway's `Application not found`. So the Lovable preview cannot reach your backend yet.
- The Analytics dashboard currently generates fake chart/activity/source data from local demo tools.

## Plan

### 1. Keep the frontend pointed at your backend
- Keep `VITE_API_URL=https://api.imaginehq.services` as the production API base.
- Add clearer frontend error handling when the backend is unreachable, so the app shows a useful message instead of empty/fake data.

### 2. Fix Google login flow in the frontend
- Keep the standard secure flow: frontend gets the Google credential, backend verifies it, backend returns your app JWT.
- Keep calling your backend endpoint `POST /api/v1/auth/google`.
- Improve the Google button loading/error handling so the login page clearly shows if:
  - Google client id is missing.
  - Google SDK did not load.
  - Backend `/api/v1/auth/google` is unreachable or rejects the credential.

### 3. Make Analytics live
- Add a typed analytics API hook that calls your backend with the user's JWT.
- Expected endpoint shape, unless your backend already differs:

```text
GET /api/v1/analytics/overview?range=30d
Authorization: Bearer <accessToken>

Response:
{
  "success": true,
  "data": {
    "range": "30d",
    "totals": {
      "views": 1234,
      "clicks": 240,
      "ctr": 19.4,
      "conversations": 12,
      "uniqueVisitors": 600,
      "liveVisitors": 4
    },
    "series": [12, 18, 22],
    "sources": [
      { "name": "Imagine", "value": 42 }
    ],
    "countries": [
      { "flag": "🇺🇸", "name": "United States", "pct": 38 }
    ],
    "tools": [
      {
        "id": "uuid",
        "name": "Tool name",
        "domain": "example.com",
        "url": "https://example.com",
        "iconUrl": null,
        "primaryColor": null,
        "views": 500,
        "clicks": 100,
        "ctr": 20,
        "trend": 8.5,
        "series": [5, 8, 13]
      }
    ],
    "realtime": [
      { "toolName": "Tool name", "page": "/", "country": "🇺🇸 US", "time": "12s" }
    ]
  }
}
```

### 4. Replace fake dashboard calculations
- Replace the seeded random chart data in `src/routes/dashboard.tsx` with data from the analytics hook.
- Add loading, error, empty, and unauthorized states.
- Keep the existing visual design and layout; only swap the data source.

### 5. Backend actions you need outside Lovable
- Deploy or reconnect the Railway service so `https://api.imaginehq.services` points to the running backend.
- Add CORS for:
  - `https://*.lovable.app`
  - `https://*.lovableproject.com`
  - your final custom domain
- Allow headers: `Content-Type, Authorization`.
- Make sure `POST /api/v1/auth/google` and `GET /api/v1/analytics/overview` exist on the backend.

## Files to change after approval
- `src/lib/auth.ts`
- `src/routes/login.tsx`
- `src/hooks/use-analytics.ts` new
- `src/routes/dashboard.tsx`

## What will not be changed
- No Lovable Cloud backend.
- No Supabase auth.
- No mock Analytics pretending to be live.