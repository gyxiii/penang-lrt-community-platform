# penang-lrt-community-platform

## Member 3 scope correction — 28 October 2026

The user clarified that the separate drawing-reallocation file does not apply to this assignment. Member 3 follows the original group allocation: feedback submission and tracking, plus at least one accurate sequence diagram with a complete explanation. **The two sequence diagrams and their explanations are now complete in the [two-page report](docs/member3/sequence/Member3_Sequence_Diagrams.docx).** Whole-platform UI work is additional shared material; it does not replace this report requirement. See the [current scope record](docs/member3/TASK_SCOPE_ZH.md).

Start with the [Chinese handoff guide](docs/member3/DELIVERY_ZH.md), the revised [English demonstration script](docs/member3/DEMO_EN.md), or the [Chinese rehearsal steps](docs/member3/DEMO_ZH.md). A clean project copy passed 140 browser checks: 62 feedback, 58 UI and 20 integration checks. The [verification record](docs/member3/final-verification.json) covers those front-end checks; it does not establish completion of coursework diagrams. The previous ZIP is a historical snapshot containing outdated scope notes and does not include the new sequence material.

The formal `admin.html` remains for the administrator module owner to implement and connect. The separate staff UI proposal is available for handoff. The changes from [PR #5](https://github.com/gyxiii/penang-lrt-community-platform/pull/5) have been merged into the default [main branch](https://github.com/gyxiii/penang-lrt-community-platform/tree/main). A normal clone now includes the feedback module, sequence report and editable diagram sources. The missing Leaflet 1.9.4 distribution images were restored from the [official source](assets/vendor/leaflet/images/SOURCE.json); existing map logic and shared styles were preserved.

## Additional prototype material for the group report

The editable two-page English [Prototype Design section](docs/member3/report/Member3_Prototype_Design.docx) includes four selected interface figures and captions. It distinguishes working public pages from the separate staff design proposal. Copyable text, original figure assets and [Chinese merge notes](docs/member3/report/REPORT_HANDOFF_ZH.md) are included in the same folder. It can supply group screenshots and text, but it is not Member 3's required sequence-diagram report.

## Additional whole-platform UI material

On Windows, double-click `查看UI原型.cmd`, or open [the interface catalogue](docs/member3/ui/index.html). It covers eight screens across the five functions, with desktop and mobile captures, a navigation diagram and shared design notes. Seven screens reuse implemented pages; the staff dashboard is clearly labelled as an isolated design prototype and does not modify saved feedback. See [UI_DESIGN_ZH.md](docs/member3/UI_DESIGN_ZH.md) for coverage and handoff details.

## Member 3 feedback submission and tracking

Feedback submission and tracking are implemented in `feedback.html`, `feedback-success.html` and `tracking.html`. Open the site using the launcher below, choose **Submit Feedback**, submit a sample concern, then follow the reference to **Track Feedback**. Three fictional sample references are also available on the tracking page.

Reports are stored in this browser only. They are not sent to an actual project team. No backend, account, database or API key is required for these pages. Staff pages can integrate the shared model in `js/feedback-store.js`; the data contract, limitations and verification results are in [docs/member3/INTEGRATION_ZH.md](docs/member3/INTEGRATION_ZH.md).

## Member 2 impact map and coursework materials

On Windows, double-click `打开网站.cmd` after cloning or extracting the project. It creates a blank `js/google-map-config.js` only when missing, preserves any existing configuration, and opens the homepage. To prepare the configuration without opening a browser, run `打开网站.cmd --prepare-only`.

On other systems, copy `js/google-map-config.example.js` to `js/google-map-config.js` once, keeping an existing configuration intact. You can then open `index.html` directly or use a static web server.

The Impact Map is implemented. It reuses three illustrative locations and four shared announcements, with search, filters, notice links, Google Maps, an offline schematic and optional OpenStreetMap tiles. Google Maps needs a valid local key; the blank configuration uses the schematic. Never commit the configured local file. Setup details are in [GOOGLE_MAPS_ZH.md](docs/member2/GOOGLE_MAPS_ZH.md).

When opened directly as a local file, Street map opens the official OpenStreetMap website in a separate tab, centered on the selected illustrative location. This avoids embedding OSM tiles without the HTTP Referer required by its [tile policy](https://operations.osmfoundation.org/policies/tiles/). Google Maps and the schematic remain embedded. HTTP/HTTPS pages retain the embedded street-map option, subject to the provider's availability and policy.

The report, two-page editable models, diagram images and editable sources, and three-minute demonstration script are in [docs/member2](docs/member2/INTEGRATION_ZH.md). Feedback and tracking are available from Member 3; the administrator page is still awaiting its owner's implementation.

Sequence diagrams and editable sources: [Chinese handoff guide](docs/member3/sequence/README_ZH.md). Both rendered Word pages were reviewed; the staff dashboard interaction is explicitly proposed, while the shared update API exists. Code and report files are delivered through main after merging [PR #5](https://github.com/gyxiii/penang-lrt-community-platform/pull/5). The group lead still needs to assemble the final Word report; personal recording remains pending.

For a fresh copy, use `git clone https://github.com/gyxiii/penang-lrt-community-platform.git`. Existing checkouts can switch to main and pull after preserving local changes. The homepage retains the shared design; use Submit Feedback and Track Feedback to open the added module.
