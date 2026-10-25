MutiaraConnect — Member A Front-End Prototype

Files:
- index.html
- announcements.html
- announcement-detail.html
- css/style.css
- js/app.js

How to run:
1. Extract the ZIP file.
2. Keep the folder structure unchanged.
3. On Windows, run 打开网站.cmd to prepare the blank local map configuration and open the homepage. Existing configured keys are preserved. On other systems, copy js/google-map-config.example.js to js/google-map-config.js once, then open index.html.
4. Use the navigation to open Announcements and click a notice to view details.

Implemented:
- Responsive shared navigation
- Homepage with five feature links
- Sample announcement cards
- Search by keyword
- Filter by area and notice type
- Announcement detail page with query-string selection
- Mobile navigation menu

Important:
All notices, dates, and locations are fictional demonstration data, not official Penang LRT information.
The Impact Map is implemented. Google Maps requires a valid local key; the offline schematic works without one. See docs/member2/INTEGRATION_ZH.md for report and diagram handoff.
Links to feedback.html, tracking.html, and admin.html are integration placeholders for the other group members' pages. They will work after those files are added to the same project folder.
