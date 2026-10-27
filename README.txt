MutiaraConnect — Member A Front-End Prototype

Member 3 scope corrected (28 October 2026):
The drawing-reallocation file does not apply to this assignment. The current Member 3 allocation is feedback submission and tracking, plus at least one accurate sequence diagram with a complete explanation. Two formal diagrams and their English explanations are now complete in docs/member3/sequence/Member3_Sequence_Diagrams.docx, a reviewed two-page Word section. Editable PNG/SVG/draw.io/Mermaid sources and notes are in docs/member3/sequence. See docs/member3/TASK_SCOPE_ZH.md and DELIVERY_ZH.md. The whole-platform UI and two-page Prototype Design are optional shared material, not a replacement for this required report task. The previous ZIP has outdated scope notes and is not a complete current Member 3 submission.
The clean project passed 140 front-end browser checks (62 feedback, 58 UI, 20 integration). These do not certify completion of coursework models. PR #5 has been merged into the default main branch: https://github.com/gyxiii/penang-lrt-community-platform/pull/5 . A normal git clone now contains the feedback module and latest sequence report. The group lead assembles the final Word report separately. The formal admin.html remains for its module owner. Official Leaflet 1.9.4 images were restored; hashes are in assets/vendor/leaflet/images/SOURCE.json.

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
Feedback submission and tracking are now available in feedback.html, feedback-success.html and tracking.html. Reports are saved in this browser only; no real report is transmitted. Open Track Feedback to try the three built-in sample references, or submit a new report and use its reference.

The admin.html link remains a placeholder for the administrator module owner. Member 3 integration details and verification records are in docs/member3/INTEGRATION_ZH.md.

Whole-platform UI design:
Double-click 查看UI原型.cmd to explore eight desktop/mobile screen previews, navigation and shared design decisions. The separate staff dashboard is a design-only proposal, not an implemented admin module. UI coverage and handoff notes are in docs/member3/UI_DESIGN_ZH.md.

Additional prototype material for the group report:
docs/member3/report/Member3_Prototype_Design.docx is a two-page editable English section with four selected figures and captions. Copyable Markdown, original figure files and REPORT_HANDOFF_ZH.md merge instructions are in the same folder. Select useful screenshots or text for the group report and renumber figure references. This document is not Member 3's required sequence-diagram report, which has now been completed separately in docs/member3/sequence.

Fresh copy: git clone https://github.com/gyxiii/penang-lrt-community-platform.git
The shared homepage appearance is retained; open Submit Feedback or Track Feedback to use the added module.
