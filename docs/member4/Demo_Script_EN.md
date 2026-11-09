# Member 4 demonstration script — Administrative Dashboard (4 minutes)

Module: F5 Administrative Dashboard · Page: `admin.html`
Recording requirement: camera on, own voice, 4 minutes for this segment (group video must stay within 15 minutes).

## Before recording

1. Use Microsoft Edge at 100% zoom in a 1440 × 900 window (or 1280 × 800). Close unrelated tabs and notifications.
2. Start the site with `打开网站.cmd`, or run `python -m http.server 8341` in the repository root and open `http://127.0.0.1:8341/admin.html`.
3. Prepare deterministic data. Easiest option: keep the three built-in samples and record the update on `MC-FB-DEMO-002`. For an end-to-end story, first clear site storage, submit one new feedback with a recognisable title, and note its reference.
4. Do one full rehearsal without recording. Confirm the update succeeds and the tracking page shows it.
5. Have the public tracking page ready to open in a second tab (`Ctrl+click` the link) so you do not lose the dashboard.

## Timeline and actions

| Time | On screen | Purpose |
| --- | --- | --- |
| 0:00–0:25 | Camera on, then homepage | Introduce yourself, M4 and the module |
| 0:25–0:50 | Homepage → click **Admin** | Prove the navigation entry works; place the page in the layered architecture |
| 0:50–1:20 | Dashboard, summary cards, queue | Explain what staff see at a glance |
| 1:20–1:55 | Status filter, area/category or keyword, empty state, reset | Demonstrate filtering |
| 1:55–2:30 | Click a queue row; read detail and timeline | Show the complete record and history |
| 2:30–3:15 | Empty save, then fill response and save | Show validation, status update and live counters |
| 3:15–3:40 | Open public tracking view | Prove cross-module integration |
| 3:40–4:00 | **Published announcements** tab, then camera | Show the announcement view and Part A limits |

## Full narration (about 465 words, roughly 3:35–4:00 including clicks and pauses)

**[0:00–0:25] Camera on, then switch to the homepage.**

Hello, I'm [Your Name], and I'm Member 4. My part is the Administrative Dashboard, the fifth function of MutiaraConnect. In this four-minute demonstration I'll show how staff review community feedback, filter the queue, record a status update, and how that update becomes visible to the public.

**[0:25–0:50] Click Admin in the shared navigation.**

I'll start from the homepage, because the dashboard must be reachable through the shared navigation. I click Admin. In our layered architecture, this page is the administrator part of the presentation layer. The queue logic in `js/admin.js` is the client-side logic layer, and the feedback records come from the mock data layer stored in this browser.

**[0:50–1:20] Point at the four summary cards, then the queue.**

At the top, four summary cards show the total number of reports and how many are Submitted, In Progress and Responded. They update immediately after every change. Below is the feedback queue. Each row shows the reference, current status, concern title, category, area and submission time. The first record is selected automatically, and its details appear on the right.

**[1:20–1:55] Select Submitted, then Area or Category, type a keyword with no match, click Reset filters.**

Staff can narrow the queue. If I choose Submitted, only new reports remain, and the count changes to one of four. I can also filter by area or category, or search for a reference, a place or a keyword. If the combination has no match, the page shows a clear empty state instead of a blank list. Reset filters restores the full queue.

**[1:55–2:30] Click a row; point at the description and each timeline entry.**

Selecting a report opens its details: the full description, category, area, submission time and any attached photo. The activity timeline records every status change with a date, a note and the actor, so earlier entries are never overwritten. This is the same record that the public tracking page reads, not a separate copy.

**[2:30–3:15] Click Save with an empty response; then choose Responded, type a response, save.**

Now I'll record a status update. I choose Responded and try to save without a response. The page rejects it and moves focus to the field, so an empty message cannot be published. I add a sample response and save. The success message confirms the change, and the badge, the counters and the timeline all update. The save calls `updateStatus` in the shared feedback store, so the history keeps the earlier entries.

**[3:15–3:40] Ctrl+click "Open the public tracking view"; switch to that tab.**

To prove the integration, I open the public tracking view with the same reference. It shows the new status and the latest team response. Because both pages use the same browser storage and storage events, an already-open tracking tab also refreshes after a staff update. That completes the loop: public submission, staff response, public tracking.

**[3:40–4:00] Return to the dashboard, open Published announcements, then look back at the camera.**

The second tab is a read-only view of published announcements, including browser-local notices added on the impact map, so staff can confirm what the community sees. To be clear, this is a Part A front-end simulation: there is no login, no server and no shared database. Thank you.

## If something goes wrong

- No reports in the queue: clear site storage for the origin, reload, and use the three built-in samples.
- Save fails with a storage message: close InPrivate mode or free site storage; use Edge normal mode.
- The filters hide every record: click **Reset filters** and continue; do not debug on camera.
- The tracking tab does not refresh: reload it once and say that both pages share the same browser storage.
- Running long: drop the area/category filter sentence and shorten the announcements section; never cut the save-and-track sequence.

## After recording

- Confirm the video shows the successful save and the updated public tracking page.
- Confirm your face and own voice are present for the whole segment.
- Keep the recording at or under 4:00 for M4 so the group video stays within 15 minutes.
