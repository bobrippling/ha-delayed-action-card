type Hass = {
  callWS(_: any): Promise<unknown>;
  callService(service: string, action: string, what?: unknown): Promise<unknown>;
  callService(service: string, action: "execute", what: HassExecutePayload): unknown;
  connection: HassConnection;
  states: {
    [entityId: EntityId]: undefined | {
      state: string;
      attributes: {
        friendly_name: string | undefined;
        options: string[];
      };
    };
  };
  entities: {
    [entityId: EntityId]: {
      name?: string;
    }
  };
};

type HassExecutePayload = {
  entity_id: EntityId,
  action: Action,
  data?: {
    option: unknown;
  },

  // one of:
  delay?: number,
  datetime?: string;
};

type HassConnection = {
  subscribeEvents(cb: (event: HassEvent) => void): void;
};

type HassEvent = {
  event_type: "delayed_action_get_config_response";
  data: DelayedActionConfig;
} | {
  event_type: "delayed_action_list_actions_response";
  data: {
    actions: Actions;
  };
};

type Actions = {
  [entityId: EntityId]: Tasks;
};
type Tasks = {
  [action: string]: Task
};

type Task = {
  action: Action;
  due: string; // iso date
  task_id: string;
}
type Action = "turn_on" | "turn_off" | "toggle";

type Config = {
  entity: EntityId;
};

type EntityId = string;

interface HassElement extends HTMLElement {
  config: Config;
}

interface HassRootElement extends Element {
  delayedActionConfig?: DelayedActionConfig;
  hass?: Hass;
}

type DelayedActionConfig = {
  domains: string[];
};

const enabledCards = [
  "better-thermostat-ui-card",
  "hui-button-card",
  "hui-entities-card",
  "hui-entity-button-card",
  "hui-entity-card",
  "hui-glance-card",
  "hui-horizontal-stack-card",
  "hui-light-card",
  "hui-media-control-card",
  "hui-picture-elements",
  "hui-picture-glance-card",
  "hui-thermostat-card",
  "hui-vertical-stack-card",
  "mushroom-light-card",
  "mushroom-entity-card",
  "hui-tile-card",
  "mushroom-fan-card",
  "mushroom-thermostat-card",
  "mushroom-lock-card",
  "mushroom-vacuum-card",
  "mushroom-select-card",
  "bubble-card",
  "mushroom-template-badge",
  "hui-entity-badge",
  "mushroom-cover-card"
];

async function fetchTasks(hass: Hass) {
  try {
    //console.log(new Date().toISOString() + ": fetchTasks() begin");
    await hass.callWS({
      type: "call_service",
      domain: "delayed_action",
      service: "list",
    });
    //console.log(new Date().toISOString() + ": fetchTasks() end");
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

function deepQuerySelectorAll(selector: string, rootNode = document.body) {
  const nodes: Element[] = [];
  const traverse = (node: Element) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches(selector)) nodes.push(node);
    // @ts-ignore
    [...node.children].forEach(traverse);
    // @ts-ignore
    if (node.shadowRoot) [...node.shadowRoot.children].forEach(traverse);
  };
  traverse(rootNode);
  return nodes;
}

function extendCard(element: HassElement, hass: Hass, config: Config, tasks: Tasks, entityId?: EntityId) {
  if (element.querySelector(".cornerButton")) {
    const innerDiv = element.querySelector(".cornerButton div")! as HTMLElement;
    // Überprüfen, ob die Entität in den Tasks enthalten ist und das innerDiv entsprechend einfärben
    if (
      tasks &&
      Object.values(tasks).length > 0 &&
      element.config.entity === entityId
    ) {
      innerDiv.style.backgroundColor = "var(--accent-color)"; // Task existiert
      innerDiv.className = "blink";
    } else {
      innerDiv.style.backgroundColor = "var(--disabled-text-color)"; // Kein Task
      innerDiv.className = "";
    }
    return; // Button already added
  }
  cardElements(element, hass, config);
}

function extendMushroomCard(element: HassElement, hass: Hass, config: Config, tasks: Tasks, entityId: EntityId | undefined) {
  const container = element.shadowRoot!
    .querySelector("ha-card mushroom-card mushroom-state-item")!
    .shadowRoot!.querySelector(".container") as HassElement;

  if (container.querySelector(".cornerButton")) {
    const innerDiv = container.querySelector(".cornerButton div")! as HTMLElement;
    if (
      tasks &&
      Object.values(tasks).length > 0 &&
      element.config.entity === entityId
    ) {
      innerDiv.style.backgroundColor = "var(--accent-color)";
      innerDiv.className = "blink";
    } else {
      innerDiv.style.backgroundColor = "var(--disabled-text-color)";
      innerDiv.className = "";
    }
    return;
  }
  cardElements(container, hass, config, '-6px');
}

function extendButtonCard(element: HassElement, hass: Hass, config: Config, tasks: Tasks, entityId: EntityId | undefined) {
  const container = element.shadowRoot!.querySelector("ha-card") as HassElement; // ha-ripple")
  if (container.querySelector(".cornerButton")) {
    const innerDiv = container.querySelector(".cornerButton div")! as HTMLElement;
    if (
      tasks &&
      Object.values(tasks).length > 0 &&
      element.config.entity === entityId
    ) {
      innerDiv.style.backgroundColor = "var(--accent-color)";
      innerDiv.className = "blink";
    } else {
      innerDiv.style.backgroundColor = "var(--disabled-text-color)";
      innerDiv.className = "";
    }
    return;
  }
  cardElements(container, hass, config, "-6px");
}

function extendTileCard(element: HassElement, hass: Hass, config: Config, tasks: Tasks, entityId: EntityId | undefined) {
  const haCard = element.shadowRoot!.querySelector("ha-card") as HassElement;
  let container: HassElement;
  let resizedButton = false;
  if (element.parentElement!.parentElement!.style.cssText.indexOf("column-size") > -1) {
    container = haCard;
    resizedButton = true;
  } else {
    container = haCard.querySelector(".content")!;
  }
  if (container.querySelector(".cornerButton")) {
    const innerDiv = container.querySelector(".cornerButton div")! as HTMLElement;
    if(resizedButton) {
      innerDiv.parentElement!.style.top = "50%";
      innerDiv.parentElement!.style.marginTop = "-11px";
    }
    if (
      tasks &&
      Object.values(tasks).length > 0 &&
      element.config.entity === entityId
    ) {
      innerDiv.style.backgroundColor = "var(--accent-color)";
      innerDiv.className = "blink";
    } else {
      innerDiv.style.backgroundColor = "var(--disabled-text-color)";
      innerDiv.className = "";
    }
    return;
  }
  cardElements(container, hass, config, "-6px");
}

function extendBadge(element: HassElement, hass: Hass, config: Config, tasks: Tasks, entityId: EntityId | undefined) {
  const container = element;
  if (container.querySelector(".cornerButton")) {
    const innerDiv = container.querySelector(".cornerButton div")! as HTMLElement;
    if (
      tasks &&
      Object.values(tasks).length > 0 &&
      config.entity === entityId
    ) {
      innerDiv.style.backgroundColor = "var(--accent-color)";
      innerDiv.className = "blink";
    } else {
      innerDiv.style.backgroundColor = "var(--disabled-text-color)";
      innerDiv.className = "";
    }
    return;
  }
  cardElementsBottom(container, hass, config, "-6px");
}

function cardElementsBottom(element: HassElement, hass: Hass, config: Config, offset?: string, additionalClass?: string) {
  cardElements(element, hass, config, offset, additionalClass);
  const cornerButton = element.querySelector(".cornerButton")! as HTMLElement;
  cornerButton.style.right = "";
  cornerButton.style.bottom = "-5px";
  cornerButton.style.width = "12px";
  cornerButton.style.height = "12px";
  cornerButton.style.borderRight = "";
  cornerButton.style.borderBottom =
  "solid 1px var(--ha-card-border-color, var(--divider-color, #e0e0e0))";

  const cornerButtonIndicator = cornerButton.querySelector(".cornerButtonIndicator")! as HTMLElement;
  cornerButtonIndicator.style.width = "6px";
  cornerButtonIndicator.style.height = "6px";
  cornerButtonIndicator.style.top = "3px";
  cornerButtonIndicator.style.left = "3px";
}

function cardElements(element: HassElement, hass: Hass, config: Config, offset?: string, additionalClass?: string) {
  const cornerButton = document.createElement("div");
  cornerButton.className = "cornerButton" + (additionalClass ? " " + additionalClass : "");
  cornerButton.style.position = "absolute";
  cornerButton.style.right =
    offset !== undefined && offset !== "" && offset.length > 0
      ? offset
      : element.className.indexOf("container") > -1
      ? "-30px"
      : "-22px";
  cornerButton.style.width = "22px";
  cornerButton.style.height = "22px";
  cornerButton.style.backgroundColor =
    "var(--ha-card-background, var(--card-background-color, #fff))";
  cornerButton.style.borderRadius = "12px";
  cornerButton.style.borderRight =
    "solid 1px var(--ha-card-border-color, var(--divider-color, #e0e0e0))";
  cornerButton.style.zIndex = "1";

  const innerDiv = document.createElement("div");
  innerDiv.className = "cornerButtonIndicator";
  innerDiv.style.borderRadius = "20px";
  innerDiv.style.width = "11px";
  innerDiv.style.height = "11px";
  innerDiv.style.top = "6px";
  innerDiv.style.left = "6px";
  innerDiv.style.position = "relative";
  innerDiv.style.backgroundColor = "var(--disabled-text-color)";
  cornerButton.appendChild(innerDiv);

  const timerDialog = document.createElement("div");
  timerDialog.style.display = "none";
  timerDialog.style.position = "absolute";
  timerDialog.style.top = "34px";
  timerDialog.style.right = "-28px";
  timerDialog.style.backgroundColor = "white";
  timerDialog.style.padding = "10px";
  timerDialog.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.1)";
  timerDialog.style.zIndex = "1";

  const secondsInput = document.createElement("input");
  secondsInput.type = "number";
  secondsInput.placeholder = "Seconds";

  const cancelButton = document.createElement("button");
  cancelButton.innerText = "Cancel";
  cancelButton.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    timerDialog.style.display = "none";
  });

  const submitButton = document.createElement("button");
  submitButton.innerText = "Submit";
  submitButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const seconds = parseInt(secondsInput.value, 10);
    if (isNaN(seconds)) {
      return;
    }
    let entityId = config.entity;
    hass.callService("delayed_action", "execute", {
      entity_id: entityId,
      delay: seconds,
      action: "turn_on",
    });
    timerDialog.style.display = "none";
  });

  secondsInput.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
  });
  timerDialog.appendChild(secondsInput);
  timerDialog.appendChild(cancelButton);
  timerDialog.appendChild(submitButton);

  cornerButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    //timerDialog.style.display = "block";
    openDialog(hass, config.entity, (e.target as Element).classList.contains("blink"));
  });

  cornerButton.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  cornerButton.addEventListener("mouseup", (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  element.style.position = "relative";
  element.appendChild(cornerButton);
  element.appendChild(timerDialog);
  const style = document.createElement("style");
  style.textContent = `
        .blink {
          animation: blink-animation 1s infinite;
        }
        @keyframes blink-animation {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0;
          }
        }
      `;
  element.appendChild(style);
}

function startsWithAny(entity: EntityId, array: string[]) {
  return array.some((prefix) => entity.startsWith(prefix));
}

function findAndExtendCards(element: HassElement, hass: Hass, tasks: Tasks, entityId?: EntityId) {
  if (element.shadowRoot) {
    let cardElements: NodeListOf<Element>;
    const homeAssistant = document.querySelector("home-assistant") as HassRootElement;
    const config = homeAssistant.delayedActionConfig as DelayedActionConfig | undefined;
    if (config) {
      switch (element.tagName) {
        case "HUI-ENTITIES-CARD":
          cardElements = element.shadowRoot.querySelectorAll("ha-card");
          cardElements.forEach((card) => {
            // EntityCard
            if (card.getAttribute("extended") !== "true") {
              let elem = card.querySelectorAll("#states hui-toggle-entity-row, #states hui-cover-entity-row");
              if (elem.length > 0) {
                elem.forEach((e) => {
                  let rowElement = e.shadowRoot!.querySelector(
                    "hui-generic-entity-row, hui-toggle-entity-row"
                  ) as HassElement;
                  if (
                    rowElement.config.hasOwnProperty("entity") && rowElement.config.entity !== undefined &&
                    startsWithAny(
                      rowElement.config.entity,
                      config.domains
                    )
                  ) {
                    extendCard(
                      rowElement,
                      hass,
                      {
                        entity: rowElement.config.entity,
                      },
                      tasks,
                      entityId
                    );
                    e.setAttribute("extended", "true");
                  }
                });
              }
              elem = card.querySelectorAll("#states hui-toggle-entity-row, #states hui-cover-entity-row");
              if (elem.length > 0) {
                elem.forEach((e) => {
                  let rowElement = e.shadowRoot!.querySelector(
                    "hui-generic-entity-row, hui-select-entity-row"
                  ) as HassElement;
                  if (
                    rowElement.config.hasOwnProperty("entity") && rowElement.config.entity !== undefined &&
                    startsWithAny(
                      rowElement.config.entity,
                      config.domains
                    )
                  ) {
                    extendCard(
                      rowElement,
                      hass,
                      {
                        entity: rowElement.config.entity,
                      },
                      tasks,
                      entityId
                    );
                    e.setAttribute("extended", "true");
                  }
                });
              }
            }
          });
          break;
        case "HUI-BUTTON-CARD":
          // ButtonCard
          if (
            element.config.hasOwnProperty("entity") && element.config.entity !== undefined &&
            startsWithAny(
              element.config.entity,
              config.domains
            )
          ) {
            extendButtonCard(
              element,
              hass,
              {
                entity: element.config.entity,
              },
              tasks,
              entityId
            );
            element.setAttribute("extended", "true");
            (element.shadowRoot.querySelector("ha-card")! as HTMLElement).style.overflow =
              "visible";
          }
          break;
        case "HUI-COVER-CARD":
        case "HUI-LIGHT-CARD":
        case "HUI-TILE-CARD":
          if (
            element.config.hasOwnProperty("entity") && element.config.entity !== undefined &&
            startsWithAny(
              element.config.entity,
              config.domains
            )
          ) {
            extendTileCard(
              element,
              hass,
              {
                entity: element.config.entity,
              },
              tasks,
              entityId
            );
            element.setAttribute("extended", "true");
            (element.shadowRoot.querySelector("ha-card")! as HTMLElement).style.overflow =
              "visible";
          }
          break;
        case "MUSHROOM-LIGHT-CARD":
        case "MUSHROOM-FAN-CARD":
        case "MUSHROOM-COVER-CARD":
        case "MUSHROOM-THERMOSTAT-CARD":
        case "MUSHROOM-LOCK-CARD":
        case "MUSHROOM-VACUUM-CARD":
        case "MUSHROOM-ENTITY-CARD":
        case "MUSHROOM-SELECT-CARD":
          if (
            element.config.hasOwnProperty("entity") && element.config.entity !== undefined &&
            startsWithAny(
              element.config.entity,
              config.domains
            )
          ) {
            extendMushroomCard(
              element,
              hass,
              {
                entity: element.config.entity,
              },
              tasks,
              entityId
            );
            element.setAttribute("extended", "true");
          }
          break;
        case "MUSHROOM-TEMPLATE-BADGE":
        case "HUI-ENTITY-BADGE":
          if (
            element.config.hasOwnProperty("entity") && element.config.entity !== undefined &&
            startsWithAny(
              element.config.entity,
              config.domains
            )
          ) {
            const targetElement = element.shadowRoot.children[0]! as HassElement;
            extendBadge(
              targetElement,
              hass,
              {
                entity: element.config.entity,
              },
              tasks,
              entityId
            );
            element.setAttribute("extended", "true");
          }
          break;
        default:
          break;
      }
    }

    // Rekursive Suche in Schatten-DOMs
    const childElements = element.shadowRoot.querySelectorAll(
      enabledCards.join(",")
    );
    childElements.forEach((child) =>
      findAndExtendCards(child as HassElement, hass, tasks, entityId)
    );
  }
}

async function applyCardModifications(hass: Hass) {
  const cards = deepQuerySelectorAll(enabledCards.join(","));
  cards.forEach((element) => {
    findAndExtendCards(element as HassElement, hass, {} /*[]*/);
  });
}

async function _updateContent(hass: Hass, actions: Actions) {
  applyCardModifications(hass);
  const cards = deepQuerySelectorAll(enabledCards.join(","));
  cards.forEach((element) => {
    for (const [entityId, tasks] of Object.entries(actions)) {
      findAndExtendCards(element as HassElement, hass, tasks, entityId);
    }
  });
}

async function setupCustomExtension() {
  const homeAssistant = document.querySelector("home-assistant") as HassRootElement | undefined;
  let hass: Hass | undefined;
  if (homeAssistant && (hass = homeAssistant.hass)) {
    //console.log("setupCustomExtension(): have HA & HA.hass");
    hass.connection.subscribeEvents((event) => {
      if (event.event_type === "delayed_action_get_config_response") {
        //console.log("got (config) event", event);
        homeAssistant.delayedActionConfig = event.data;
      }
    });
    hass.connection.subscribeEvents((event) => {
      if (event.event_type === "delayed_action_list_actions_response") {
        //console.log("got (action) event - _updateContent()", event);
        _updateContent(hass!, event.data.actions);
      }
    });
    await getConfig(hass);
    //console.log("getConfig done, applyCardModifications()");
    applyCardModifications(hass);
    //fetchTasks(hass);
  } else {
    //console.log("setupCustomExtension(): no HA/hass yet");
    setTimeout(setupCustomExtension, 500);
  }
}

function getEntityActions(entityId: EntityId) {
  let titles = {
    turn_on: "Turn On",
    turn_off: "Turn Off",
    toggle: "Toggle",
    play_media: "Play Media",
    media_pause: "Pause",
    media_play: "Play",
    media_stop: "Stop",
    media_next_track: "Next Track",
    media_previous_track: "Previous Track",
    volume_mute: "Mute",
    volume_down: "Volume Down",
    volume_up: "Volume Up",
    open_cover: "Open",
    close_cover: "Close",
    stop_cover: "Stop",
    start: "Start",
    pause: "Pause",
    stop: "Stop",
    return_to_base: "Return to Base",
    locate: "Locate",
    lock: "Lock",
    unlock: "Unlock",
    open: "Open",
    trigger: "Trigger",
    dock: "Dock",
    start_mowing: "Start Mowing",
    select_option: "Select Option",
  };
  let result: (keyof typeof titles)[] = [];
  const state = (document.querySelector("home-assistant") as HassRootElement | undefined)?.hass!.states[entityId]!.state;
  let defaultIndex: number | undefined;

  switch (entityId.split(".")[0]) {
    case "light":
    case "switch":
    case "input_boolean":
    case "script":
    case "fan":
    case "climate":
    case "siren":
    case "water_heater":
      result = ["turn_on", "turn_off", "toggle"];
      defaultIndex = state === "on" ? 1 : 0;
      break;
    case "media_player":
      result = [
        "turn_on",
        "turn_off",
        "play_media",
        "media_pause",
        "media_play",
        "media_stop",
        "media_next_track",
        "media_previous_track",
        "volume_mute",
        "volume_down",
        "volume_up",
      ];
      break;
    case "cover":
      result = ["open_cover", "close_cover", "stop_cover"];
      break;
    case "vacuum":
      result = ["start", "pause", "stop", "return_to_base", "locate"];
      break;
    case "lock":
      result = ["lock", "unlock", "open"];
      break;
    case "scene":
      result = ["turn_on"];
      break;
    case "automation":
      result = ["turn_on", "turn_off", "trigger"];
      defaultIndex = state === "on" ? 1 : 0;
      break;
    case "lawn_mower":
      result = ["dock", "pause", "start_mowing"];
      break;
    case "select":
    case "input_select":
        result = ["select_option"];
      break;
    default:
      break;
  }
  return result
    .map((action, i) => `<option value="${action}"${i === defaultIndex ? " selected" : ""}>${titles[action]}</option>`)
    .join("");
}

function openDialog(hass: Hass, entityId: EntityId, alreadyScheduled: boolean) {
  const dialog = document.createElement("ha-dialog") as HTMLDialogElement;
  dialog.open = true;

  const dialogHeader = document.createElement("div");
  dialogHeader.style.display = "flex";
  dialogHeader.style.gap = "12px";
  dialogHeader.style.alignItems = "start";
  dialogHeader.innerHTML = `
      <ha-icon-button id="closeButton" style="background: none; border: none; font-size: 36px; cursor: pointer;">&times;</ha-icon-button>
      <p style="margin: 9px 0 0 0" title='Delayed Action'>Delayed Action: ${hass.entities[entityId].name ?? entityId}</p>
    `;
  ((dialog as any).heading as Element) = dialogHeader;

  const content = document.createElement("div");

  let selectOptions = entityId.indexOf("select.") > -1
    ? `<label for="delayOption">Option</label><select id="delayOption">` + hass.states[entityId]!.attributes.options.map((option) => `<option value="${option}">${option}</option>`).join("") + `</select>`
    : ``;

  content.innerHTML =
    `
        <style>
          .custom-dialog-content {
            padding: 0px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-width: 500px;
            box-sizing: border-box;
          }
          .custom-dialog-content select, .custom-dialog-content input[type="datetime-local"] {
              padding: 8px;
              font-size: 1.2em;
              border: none;
              outline: none;
              border-radius: 4px;
              width: 100%;
          }
          .custom-dialog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .custom-dialog-subheader {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }
          .custom-dialog-header h2 {
            margin: 0;
          }
          .custom-dialog-subheader h4 {
            margin: 0;
          }
          .custom-dialog-content label {
            font-weight: bold;
          }
          .time-input {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .time-input input[type="number"] {
            width: 50px;
            padding: 8px;
            text-align: center;
            font-size: 1.2em;
            border: none;
            outline: none;
          }
          .time-input input[type="number"]::-webkit-outer-spin-button,
          .time-input input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .time-input input[type="number"] {
            -moz-appearance: textfield;
          }
          .time-input .time-control {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 30%;
            touch-action: manipulation;
          }
          .time-input .time-control button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2em;
            color: var(--primary-color);
            --mdc-icon-size: 64px;
          }
          .custom-dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
          .custom-dialog-actions button {
            padding: 8px 16px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
          }
          #delayDate {
            width: 100%;
          }
        </style>
        <div class="custom-dialog-content">` + (
          alreadyScheduled ? "<label style='color: var(--accent-color);'>(Schedule already set)</label>" : ""
        ) + `
          <label for="delayAction">Action</label>
          <select id="delayAction">` + getEntityActions(entityId) + `</select>` + selectOptions + `
          <label for="delayTime">Delay for</label>
          <div id="delayTime" class="time-input">
            <div class="time-control">
              Hours<button id="increaseHours"><ha-icon icon="mdi:chevron-up"></ha-icon></button>
              <input id="delayHours" type="number" min="0" max="23" placeholder="HH" value="0">
              <button id="decreaseHours"><ha-icon icon="mdi:chevron-down"></ha-icon></button>
            </div>
            <span></span>
            <div class="time-control">
              Minutes<button id="increaseMinutes"><ha-icon icon="mdi:chevron-up"></ha-icon></button>
              <input id="delayMinutes" type="number" min="0" max="59" placeholder="MM" value="0">
              <button id="decreaseMinutes"><ha-icon icon="mdi:chevron-down"></ha-icon></button>
            </div>
            <span></span>
            <div class="time-control">
              Seconds<button id="increaseSeconds"><ha-icon icon="mdi:chevron-up"></ha-icon></button>
              <input id="delaySeconds" type="number" min="0" max="59" placeholder="SS" value="0">
              <button id="decreaseSeconds"><ha-icon icon="mdi:chevron-down"></ha-icon></button>
            </div>
          </div>
          <label for="delayDate">or start at</label>
          <input id="delayDate" type="datetime-local">
          <p style="font-size: 0.8em; color: var(--error-color); display:none" id="error"></p>
        </div>
      `;
  const primaryButton = document.createElement("mwc-button");
  primaryButton.setAttribute("slot", "primaryAction");
  primaryButton.id = "submitButton";
  primaryButton.innerText = "Submit";
  primaryButton.addEventListener("click", () => {
    const hours = parseInt(delayHours.value, 10) || 0;
    const minutes = parseInt(delayMinutes.value, 10) || 0;
    const seconds = parseInt(delaySeconds.value, 10) || 0;
    const date = delayDate.value;
    const action = (content.querySelector("#delayAction") as HTMLSelectElement).value || "turn_on";
    const select = content.querySelector("#delayOption") as HTMLSelectElement;

    if (hours === 0 && minutes === 0 && seconds === 0 && !date) {
      const error = content.querySelector("#error") as HTMLParagraphElement;
      error.innerText =
        "Please enter a delay time or a start date.";
      error.style.display = "block";
      return;
    }

    const delay = hours * 3600 + minutes * 60 + seconds;

    let config: HassExecutePayload = {
      entity_id: entityId,
      action: action as Action,
    };

    if(select != null) {
      config.data = { option: select.value };
    }

    if (date) {
      config.datetime = date;
    } else {
      config.delay = delay;
    }
    hass.callService("delayed_action", "execute", config);

    closeDialog();
  });

  function closeDialog() {
    document
      .querySelector("home-assistant")!
      .shadowRoot!.querySelector("ha-dialog")!
      .remove();
  }

  const secondaryButton = document.createElement("mwc-button");
  secondaryButton.setAttribute("slot", "secondaryAction");
  secondaryButton.id = "submitButton";
  secondaryButton.innerText = "Cancel";
  secondaryButton.addEventListener("click", closeDialog);

  dialog.appendChild(content);
  dialog.appendChild(secondaryButton);
  dialog.appendChild(primaryButton);
  document.querySelector("home-assistant")!.shadowRoot!.appendChild(dialog);

  const delayHours = content.querySelector("#delayHours") as HTMLInputElement;
  const delayMinutes = content.querySelector("#delayMinutes") as HTMLInputElement;
  const delaySeconds = content.querySelector("#delaySeconds") as HTMLInputElement;
  const delayDate = content.querySelector("#delayDate") as HTMLInputElement
  const increaseHours = content.querySelector("#increaseHours")!;
  const decreaseHours = content.querySelector("#decreaseHours")!;
  const increaseMinutes = content.querySelector("#increaseMinutes")!;
  const decreaseMinutes = content.querySelector("#decreaseMinutes")!;
  const increaseSeconds = content.querySelector("#increaseSeconds")!;
  const decreaseSeconds = content.querySelector("#decreaseSeconds")!;

  const closeButton = ((dialog as any).heading as Element).querySelector("#closeButton")!;
  closeButton.addEventListener("click", closeDialog);

  const incrementValue = (input: HTMLInputElement, max: number) => {
    let value = parseInt(input.value, 10);
    if (isNaN(value)) value = 0;
    value = (value + 1) % (max + 1);
    input.value = "" + value;
    (document
      .querySelector("home-assistant")!
      .shadowRoot!.querySelector("#error")! as HTMLElement).style.display = "none";
  };

  const decrementValue = (input: HTMLInputElement, max: number) => {
    let value = parseInt(input.value, 10);
    if (isNaN(value)) value = 0;
    value = (value - 1 + (max + 1)) % (max + 1);
    input.value = "" + value;
    (document
      .querySelector("home-assistant")!
      .shadowRoot!.querySelector("#error")! as HTMLElement).style.display = "none";
  };

  increaseHours.addEventListener("click", () => incrementValue(delayHours, 23));
  decreaseHours.addEventListener("click", () => decrementValue(delayHours, 23));
  increaseMinutes.addEventListener("click", () =>
    incrementValue(delayMinutes, 59)
  );
  decreaseMinutes.addEventListener("click", () =>
    decrementValue(delayMinutes, 59)
  );
  increaseSeconds.addEventListener("click", () =>
    incrementValue(delaySeconds, 59)
  );
  decreaseSeconds.addEventListener("click", () =>
    decrementValue(delaySeconds, 59)
  );
}

const getConfig = async (hass: Hass) => {
  //console.log(new Date().toISOString() + ": getConfig() begin");
  await hass.callService("delayed_action", "get_config").catch((error: unknown) => {
    console.error("Error fetching config:", error);
  });
  //console.log(new Date().toISOString() + ": getConfig() end");
};

setupCustomExtension();

const tryFetch = async () => {
  const homeAssistant = document.querySelector("home-assistant") as HassRootElement | undefined;
  if (homeAssistant && homeAssistant.hass) {
    await fetchTasks(homeAssistant.hass);
    setTimeout(tryFetch, 10000);
  } else {
    setTimeout(tryFetch, 250);
  }
}
setTimeout(() => {
  //console.log(new Date().toISOString() + ": initial load, fetching...");
  tryFetch();
}, 500);

class DelayedActionCard extends HTMLElement {
  config: Config | undefined;
  _hass?: Hass;
  tasks?: Actions;

  setConfig(config: Config) {
    this.config = config;
    this.attachShadow({ mode: "open" });
    this.render();
  }

  connectedCallback() {
    if (this.isConnected && this.hass) {
      this.hass.connection.subscribeEvents((event) => {
        if (event.event_type === "delayed_action_list_actions_response") {
          this.tasks = event.data.actions;
          this.render();
        }
      });
    }
  }

  async cancelTask(event: Event) {
    const target = (event.target! as Element)
    const entityId = target.getAttribute("data-entity");
    const taskId = target.getAttribute("data-task");
    try {
      await this.hass!.callService("delayed_action", "cancel", {
        entity_id: entityId,
        task_id: taskId,
      });
      this.hass!.callService("delayed_action", "list"); // Refresh the task list after cancellation
    } catch (error) {
      console.error("Error cancelling task:", error);
    }
  }

  getFriendlyName(entityId: EntityId): string {
    const entity = this.hass!.states[entityId];
    return entity?.attributes.friendly_name ?? entityId;
  }

  getActionIcon(action: Action) {
    switch (action) {
      case "turn_on":
        return "mdi:power";
      case "turn_off":
        return "mdi:power-off";
      case "toggle":
        return "mdi:toggle-switch";
      default:
        return "mdi:alert-circle-outline";
    }
  }

  render() {
    if (!this.hass || !this.tasks) {
      this.shadowRoot!.innerHTML = `
        <ha-card header="Delayed Actions">
          <div class="tasks">
            Loading ${!this.hass ? "HA data" : "Tasks"}...
          </div>
        </ha-card>
      `;
      return;
    }

    let taskList = "";
    for (const [entityId, tasks] of Object.entries(this.tasks)) {
      taskList += `<div class="taskentity"><h2>${this.getFriendlyName(
        entityId
      )}</h2>`;
      for (const [_action, task] of Object.entries(tasks)) {
        taskList += `
          <div class="task">
            <ha-icon icon="${this.getActionIcon(task.action)}"></ha-icon>
            <span>${
              task.action == "turn_on"
                ? "turn on"
                : task.action == "turn_off"
                ? "turn off"
                : task.action == "toggle"
                ? "toggle"
                : task.action
            }</span>
            <span>${new Date(task.due).toLocaleString()}</span>
            <mwc-button class="warning deleteDelayedAction" outlined data-entity="${entityId}" data-task="${
          task.task_id
        }">Cancel</mwc-button>
          </div>
        `;
      }
      taskList += `</div>`;
    }

    this.shadowRoot!.innerHTML = `
    <style>
        mwc-button.warning {
          --mdc-theme-primary: var(--error-color);
          margin-bottom: 4px;
        }
        .tasks {
          padding: 16px;
        }
        .taskentity {
            margin-bottom: 16px;
        }
        .task {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cancel-button {
          color: var(--error-state-color);
        }
        ha-icon {
          padding-right: 8px;
        }
      </style>
      <ha-card header="Delayed Actions">
        <div class="tasks">
          ${taskList}
        </div>
      </ha-card>
    `;
    this.shadowRoot!
      .querySelectorAll(".deleteDelayedAction")
      .forEach((button) => {
        button.addEventListener("click", this.cancelTask.bind(this));
      });
  }

  set hass(hass: Hass) {
    this._hass = hass;
  }

  get hass(): Hass | undefined {
    return this._hass;
  }
}

customElements.define("delayed-action-card", DelayedActionCard);

interface Window {
  customCards?: unknown[];
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "delayed-action-card",
  name: "Delayed Action Card",
  description: "Shows and manages delayed actions",
  preview: true,
  documentationURL: "https://github.com/bhuebschen/delayed-action-card",
});

console.info(
  "%c  DELAYED-ACTION-CARD  \n%c  Version: 1.0.4       ",
  "background: #c0c0c0; color: black; font-weight: bold; padding: 5px 0;",
  "color: white; background: #333; font-weight: bold; padding: 5px 0;"
);
