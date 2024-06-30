# Delayed Action Card

The `Delayed Action Card` is a custom Home Assistant card that displays and manages delayed actions for various entities. It provides a user interface to view, create, and cancel delayed actions on supported entities.

[![hacs][hacs-image]][hacs-url]
[![GitHub Sponsors][gh-sponsors-image]][gh-sponsors-url]

https://github.com/bhuebschen/delayed-action-card/assets/1864448/29967331-d993-42a2-a391-d9b04fb37d50

The Delayed Action Card is a custom Lovelace card for Home Assistant that allows you to create a circular menu of actions or shortcuts. This card provides a visually appealing way to access common actions or navigate to different parts of your Home Assistant dashboard.

### Requirements

- Ensure the "Delayed Action" custom integration is installed. You can find it at: https://github.com/bhuebschen/delayed_action

### Features

- Display current delayed actions for entities
- Create new delayed action with a specified delay or start time
- Cancel existing delayed action
- Support for various entity types including lights, switches, media players, covers, and more

### Installation:

### [HACS](hacs) (Home Assistant Community Store)

1. Go to HACS page on your Home Assistant instance
1. Add this repository (https://github.com/bhuebschen/delayed-action-card) via HACS Custom repositories [How to add Custom Repositories](https://hacs.xyz/docs/faq/custom_repositories/)
1. Select `Frontend`
1. Press add icon and search for `Delayed Action Card`
1. Select `Delayed Action Card` repo and install
1. Force refresh the Home Assistant page (<kbd>Ctrl</kbd> + <kbd>F5</kbd> / (<kbd>Shift</kbd> +) <kbd>⌘</kbd> + <kbd>R</kbd>)
1. Add delayed-action-card to your page

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=bhuebschen&repository=delayed-action-card&category=plugin)

### Manual

1. Download the 'delayed-action-card.js' from the latest [release][release-url] (with right click, save link as)
1. Place the downloaded file on your Home Assistant machine in the `config/www` folder (when there is no `www` folder in the folder where your `configuration.yaml` file is, create it and place the file there)
1. In Home Assistant go to `Configuration->Lovelace Dashboards->Resources` (When there is no `resources` tag on the `Lovelace Dashboard` page, enable advanced mode in your account settings, and retry this step)
1. Add a new resource
   1. Url = `/local/delayed-action-card.js`
   1. Resource type = `module`
1. Force refresh the Home Assistant page (<kbd>Ctrl</kbd> + <kbd>F5</kbd> / (<kbd>Shift</kbd> +) <kbd>⌘</kbd> + <kbd>R</kbd>)
1. Add delayed-action-card to your page

### Performance improvements

While `Delayed Action Card` can be installed as a [lovelace resource](https://www.home-assistant.io/lovelace/dashboards/#resources), some functionality will benefit greatly from it being installed as a [frontend module](https://www.home-assistant.io/integrations/frontend/#extra_module_url) instead.

To do that, add the following to your `configuration.yaml` file and restart Home Assistant and remove it from the Resources:

```yaml
frontend:
  extra_module_url:
    - /hacsfiles/delayed-action-card/delayed-action-card.js
```


### Usage:
1. Clicking the floating button toggles the visibility of the circular menu.
2. Each menu item performs a predefined action, such as controlling devices or navigating to other dashboards.

### Issues & Contributions:
If you encounter any issues or have suggestions for improvements, feel free to [open an issue](https://github.com/bhuebschen/delayed-action-card/issues) or submit a pull request.

## License

MIT © [Benedikt Hübschen][bhuebschen]

<!-- Badges -->

[hacs-url]: https://github.com/hacs/integration
[hacs-image]: https://img.shields.io/badge/hacs-custom-orange.svg?style=flat-square
[gh-sponsors-url]: https://github.com/sponsors/bhuebschen
[gh-sponsors-image]: https://img.shields.io/github/sponsors/bhuebschen?style=flat-square

<!-- References -->

[preview]: https://github.com/bhuebschen/delayed-action-card/assets/1864448/29967331-d993-42a2-a391-d9b04fb37d50
[home-assistant]: https://www.home-assistant.io/
[hacs]: https://hacs.xyz
[latest-release]: https://github.com/bhuebschen/delayed-action-card/releases/latest
[ha-scripts]: https://www.home-assistant.io/docs/scripts/
[edit-readme]: https://github.com/bhuebschen/delayed-action-card/edit/master/README.md
