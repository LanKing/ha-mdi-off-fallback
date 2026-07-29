[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Frontend-41BDF5?logo=homeassistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Frontend-41BDF5)](https://hacs.xyz/)
[![Latest release](https://img.shields.io/github/v/release/LanKing/ha-mdi-off-fallback?label=release)](https://github.com/LanKing/ha-mdi-off-fallback/releases)
[![Downloads](https://img.shields.io/github/downloads/LanKing/ha-mdi-off-fallback/total?label=downloads)](https://github.com/LanKing/ha-mdi-off-fallback/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Home Assistant can display custom MDI icons for entities, but not every icon has a matching `-off` variant. The result is that an entity may be clearly off while its icon still looks active. This plugin fills that gap without replacing the standard Home Assistant cards.

# 🚫 MDI Off Fallback for Home Assistant

Automatically adds an MDI-style crossed-out icon when a Home Assistant entity is in an inactive state and the selected icon has no suitable native crossed-out variant.

The plugin works with standard Home Assistant Tile cards and preserves their native appearance, behavior, colors, sizing, and interactions.

It modifies only the rendered icon when a fallback is needed.

<a id="how-it-works"></a>
## 🤓 How it works

Home Assistant normally resolves an entity icon through its own frontend components.

MDI Off Fallback waits until Home Assistant has rendered the icon and then:

1. Detects Tile icons whose entity is in a configured inactive state.
2. Leaves the icon untouched if Home Assistant already rendered a native crossed-out variant.
3. Reads the actual SVG rendered by Home Assistant.
4. Cuts a diagonal transparent corridor through the original SVG using a mask.
5. Adds an MDI-style diagonal slash using the same `24 × 24` coordinate system as Material Design Icons.
6. Preserves Home Assistant's original SVG in the DOM so normal frontend updates continue to work.

The plugin does not replace `hui-tile-card`, does not recreate Home Assistant styling, and does not modify entity states.

<a id="native-ui"></a>
## 🧩 Native Home Assistant UI

The goal is to make the fallback indistinguishable from a normal Home Assistant icon.

MDI Off Fallback:

* uses the icon Home Assistant already rendered;
* keeps the standard Tile card untouched;
* keeps native tap, hold, hover, state colors, and sizing;
* uses the native inactive icon background when Home Assistant provides one;
* can add a matching faint inactive background when one is missing;
* automatically reacts when entity state or card content changes.

No custom card is required.

<a id="default-states"></a>
## ⚙️ Default inactive states

The following rules are enabled by default:

| Domain | Inactive state |
|---|---|
| `light` | `off` |
| `switch` | `off` |
| `fan` | `off` |
| `climate` | `off` |
| `media_player` | `off` |
| `cover` | `closed` |
| `humidifier` | `off` |
| `water_heater` | `off` |
| `siren` | `off` |

Other domains and states can be added through the optional global configuration file.

<a id="configuration"></a>
## 🔧 Configuration

Configuration is optional.

Without a configuration file, the built-in defaults above are used.

To customize the rules for the whole Home Assistant installation, create:

```text
/config/www/ha-mdi-off-fallback.config.json
```

Example:

```json
{
  "states": {
    "light": ["off"],
    "switch": ["off"],
    "fan": ["off"],
    "climate": ["off"],
    "media_player": ["off"],
    "cover": ["closed"],
    "humidifier": ["off"],
    "water_heater": ["off"],
    "siren": ["off"],
    "remote": ["off"]
  },
  "faint_background_when_missing": true,
  "faint_background_opacity": 0.2,
  "debug": false
}
```

The file is available to the frontend as:

```text
/local/ha-mdi-off-fallback.config.json
```

Because the configuration is stored on the Home Assistant server, the same rules are used by every browser and device.

The configuration file is separate from the HACS-managed plugin files, so plugin updates do not overwrite it.

Only entries present in `states` override the built-in defaults. Use an empty array to disable a default domain.

For example:

```json
{
  "states": {
    "fan": [],
    "media_player": ["off", "idle"]
  }
}
```

<a id="reload-config"></a>
### Reload configuration

After changing the JSON file, configuration can be reloaded without refreshing the page:

```js
haMdiOffFallback.reloadConfig()
```

Show the active configuration:

```js
haMdiOffFallback.getConfig()
```

<a id="background"></a>
### Inactive icon background

When Home Assistant already provides its normal inactive icon background, the plugin leaves it untouched.

When it is missing, the plugin can add a faint circular background matching the native Home Assistant inactive Tile treatment.

Disable it:

```json
{
  "faint_background_when_missing": false
}
```

Or change its opacity:

```json
{
  "faint_background_opacity": 0.2
}
```

<a id="installation"></a>
## 📦 Installation

### HACS

Until the plugin is available in the default HACS repository:

1. Open HACS.
2. Open **Custom repositories**.
3. Add:

```text
https://github.com/LanKing/ha-mdi-off-fallback
```

4. Select **Dashboard** as the repository type.
5. Install **HA MDI Off Fallback**.
6. Reload the Home Assistant frontend.

No custom card configuration is required.

<a id="manual-installation"></a>
### Manual installation

Copy:

```text
dist/ha-mdi-off-fallback.js
```

to:

```text
/config/www/ha-mdi-off-fallback.js
```

Then add a Dashboard resource:

```text
/local/ha-mdi-off-fallback.js
```

Resource type:

```text
JavaScript Module
```

Reload the Home Assistant frontend afterwards.

<a id="debugging"></a>
## 🐛 Debugging

Enable debug output:

```js
haMdiOffFallback.configure({
  debug: true
})
```

Force the plugin to scan the current dashboard again:

```js
haMdiOffFallback.rescan()
```

Show the plugin version:

```js
haMdiOffFallback.version
```

<a id="notes"></a>
## 📓 Notes

* The plugin currently targets Home Assistant Tile icons.
* Only configured domain/state combinations are treated as inactive.
* Existing native crossed-out icons are left untouched.
* The fallback is generated from the SVG Home Assistant already rendered; it does not maintain its own MDI icon database.
* The SVG fallback is designed for standard Material Design Icons using a `0 0 24 24` view box.
* Home Assistant frontend internals are not a stable public API. A future Home Assistant frontend update may require an update to this plugin.
* The plugin changes presentation only. It never changes entity states, services, automations, or device behavior.

<a id="why"></a>
## 💡 Why not just use `mdi:*-off`?

Because not every Material Design Icon has a matching crossed-out variant.

A custom icon may look perfect while an entity is active, but when the entity turns off there may simply be no corresponding icon such as:

```text
mdi:some-icon-off
```

MDI Off Fallback keeps the original icon and generates the missing visual state automatically.

<a id="implementation"></a>
## 🛠 Implementation

The plugin deliberately avoids monkey-patching Home Assistant's Lit components.

Instead it observes the rendered frontend DOM and follows Home Assistant's icon chain:

```text
ha-tile-icon
└── ha-state-icon
    └── ha-icon
        └── ha-svg-icon
            └── svg
```

Open Shadow Roots are discovered recursively and monitored for new cards and state changes.

The original SVG remains owned by Home Assistant. The plugin adds only the visual fallback layer and removes it again when it is no longer needed.

## 📄 License

MIT — contributions welcome.
