# penang-lrt-community-platform

## Member 2 impact map and coursework materials

On Windows, double-click `打开网站.cmd` after cloning or extracting the project. It creates a blank `js/google-map-config.js` only when missing, preserves any existing configuration, and opens the homepage. To prepare the configuration without opening a browser, run `打开网站.cmd --prepare-only`.

On other systems, copy `js/google-map-config.example.js` to `js/google-map-config.js` once, keeping an existing configuration intact. You can then open `index.html` directly or use a static web server.

The Impact Map is implemented. It reuses three illustrative locations and four shared announcements, with search, filters, notice links, Google Maps, an offline schematic and optional OpenStreetMap tiles. Google Maps needs a valid local key; the blank configuration uses the schematic. Never commit the configured local file. Setup details are in [GOOGLE_MAPS_ZH.md](docs/member2/GOOGLE_MAPS_ZH.md).

The report, two-page editable models, diagram images and editable sources, and three-minute demonstration script are in [docs/member2](docs/member2/INTEGRATION_ZH.md). The feedback, tracking and administrator modules belong to the other group members.
