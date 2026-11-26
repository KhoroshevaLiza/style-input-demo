"use strict";

const states = [
  ["rest", "В покое"],
  ["hover", "При наведении"],
  ["active", "Активный"],
];
const views = { main: "Текст", field: "Область ввода", label: "Метка", size: "Размер" };
const defaultSize = { width: 316, height: 24 };
const contentWidth = 207;
const textStylePresets = {
  main: { title: "Основной текст", fontSize: 14, fontWeight: 400, italic: false },
  emphasized: { title: "Усиленный текст", fontSize: 16, fontWeight: 500, italic: false },
  secondary: { title: "Дополнительный текст", fontSize: 12, fontWeight: 400, italic: false },
  accent: { title: "Акцентный текст", fontSize: 16, fontWeight: 400, italic: true },
  large: { title: "Крупный текст", fontSize: 18, fontWeight: 400, italic: false },
};
const textColorPalettes = {
  text: ["#F6733C", "#313E78", "#DC2219", "#12A12C", "#ECB956", "#6757B7", "#000000", "#2562AA", "#8991A9", "#000000"],
  label: ["#F6733C", "#313E78", "#B8120A", "#067A1B", "#F3AA1C", "#4937A4", "#000000", "#2562AA", "#8991A9", "#000000"],
};
const sides = ["сверху", "справа", "снизу", "слева"];
const formats = [
  ["bold", "Полужирный", "&#xe6c3;"],
  ["italic", "Курсив", "&#xe6c6;"],
  ["underline", "Подчёркнутый", "&#xe6ce;"],
  ["strike", "Зачёркнутый", "&#xe6cb;"],
];
const fonts = ["Arial", "Courier New", "Georgia", "Inter", "Montserrat", "Open Sans", "Oswald", "PT Serif", "Times New Roman"];
const fontFallbacks = {
  "Courier New": "monospace",
  Georgia: "serif",
  Montserrat: "Century Gothic, sans-serif",
  "Open Sans": "Segoe UI, sans-serif",
  Oswald: "Arial Narrow, sans-serif",
  "PT Serif": "Georgia, serif",
  "Times New Roman": "serif",
};

function typography(color) {
  return { font: "Inter", fontSize: 14, bold: false, italic: false, underline: false, strike: false, color };
}

function defaultBorderColor(state) {
  return state === "rest" ? "#d2d6da" : "#8f99a3";
}

function fieldGeometry(state, preset = "transparent") {
  const filled = preset === "filled";
  return {
    radius: 0,
    radiusMode: "unified",
    cornerRadii: [0, 0, 0, 0],
    borders: [0, 0, filled ? 0 : 1, 0],
    borderMode: "sides",
    borderWidth: filled ? 0 : 1,
    borderLine: "solid",
    borderAlpha: 100,
    background: filled ? "#FFFFFF" : null,
    backgroundAlpha: 100,
    shadow: null,
    borderColor: filled ? null : defaultBorderColor(state),
  };
}

function fieldStyle(state) {
  return {
    ...fieldGeometry(state),
    textPreset: null,
    align: "left",
    ...typography("#000000"),
  };
}

const widgetTypes = {
  text: { title: "Текст", placeholder: "Введите значение" },
};

function createWidget(type) {
  return {
    type,
    name: "",
    defaultValue: "",
    label: { text: "", placement: "left", gap: 8, ...typography("#8991a9") },
    placeholder: "",
    limitLength: "10",
    limitPattern: String.raw`/^(a-z0-9_\.-]+)@`,
    preset: "transparent",
    size: {
      width: null, height: null, heightHint: defaultSize.height, horizontal: "default", vertical: "default",
      outlineWidth: defaultSize.width,
      dimensionModes: { width: "fill", height: "auto" },
      heightOffset: 0,
      outer: { x: 0, y: 0, expanded: false, sides: [0, 0, 0, 0] },
      inner: { x: 0, y: 0, expanded: false, sides: [0, 0, 0, 0] },
      inset: { x: 0, y: 0, expanded: false, sides: [0, 0, 0, 0] },
    },
    styles: Object.fromEntries(states.map(([state]) => [state, fieldStyle(state)])),
  };
}

let widget = createWidget("text");
const defaultWidget = JSON.stringify(widget);
const resetWidgetButton = document.querySelector("[data-reset-widget]");
const ui = { view: "main", state: "rest", menu: "", added: new Set() };
const defaultShadow = { color: "#000000", alpha: 14, x: 0, y: 0, blur: 8, spread: 0 };
const shadowParameters = [
  ["x", "X", -10], ["y", "Y", -10], ["blur", "Блюр", 0], ["spread", "Размах", -10],
];
let shadowDraft = null;
const footerOptions = [
  ["variable", "Переменная", 20, 9],
  ["limits", "Ограничения", 21, 20],
  ["appearance", "Оформление", 18, 20],
  ["visibility", "Видимость", 20, 19],
  ["multiline", "Многострочное", 20, 15],
  ["hint", "Подсказка", 20, 15],
  ["description", "Описание", 20, 20],
];
const limitOptions = [
  ["required", "Заполнять обязательно"],
  ["length", "Количество символов"],
  ["pattern", "Вводимые символы"],
  ["validation", "Валидация"],
];
const appearanceParts = ["field", "size", "label"];
let separateAppearance = document.querySelector('input[name="appearance-mode"]:checked')?.value === "separate";
const metadataTextFields = {
  defaultValue: { path: "defaultValue", title: "Значение по умолчанию", label: "Значение по умолчанию", caption: "по умолчанию" },
  hint: { path: "placeholder", title: "Подсказка", label: "Подсказка", caption: "подсказка", remove: "Убрать подсказку" },
  label: { path: "label.text", title: "Название", label: "Текст метки", caption: "название" },
};
const content = document.querySelector("#settings-content");
const layout = document.querySelector(".widget-layout");
const preview = document.querySelector("#widget-preview");
const previewFrame = document.querySelector(".widget-frame");
const previewLabel = document.querySelector("#preview-label");
const previewText = document.querySelector("#preview-text");
const previewInputWrap = previewText.parentElement;

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function modelAt(path) {
  return path.split(".").reduce((value, key) => value[key], widget);
}

function setModel(path, value) {
  const keys = path.split(".");
  const key = keys.pop();
  const model = keys.length ? modelAt(keys.join(".")) : widget;
  model[key] = value;
}

function numberInput(path, label, min, max, placeholder) {
  return `<input class="compact" type="number" data-model="${path}" aria-label="${label}" min="${min}" max="${max}" value="${modelAt(path) ?? ""}"${placeholder === undefined ? "" : ` placeholder="${placeholder}"`}>`;
}

function sideInputs(path, label, max, horizontalOnly = false) {
  const indexes = horizontalOnly ? [3, 1] : [0, 1, 2, 3];
  return `<div class="border-values${horizontalOnly ? " horizontal-sides" : ""}">${indexes.map(index =>
    numberInput(path + "." + index, label + " " + sides[index], 0, max)).join("")}</div>`;
}

function textInput(path, label, placeholder = "") {
  return `<input class="wide field-name" data-model="${path}" aria-label="${label}" placeholder="${placeholder}" value="${escapeHtml(modelAt(path))}">`;
}

function selectInput(path, label, entries, className = "") {
  const current = modelAt(path);
  const options = entries.map(([value, text]) =>
    `<option value="${value}" ${value === current ? "selected" : ""}>${text}</option>`).join("");
  return `<select class="${className}" data-model="${path}" aria-label="${label}">${options}</select>`;
}

function row(label, controls) {
  return `<div class="row"><span class="row-label">${label}</span>${controls}</div>`;
}

function arrow(view) {
  return `<button class="arrow" type="button" data-view="${view}" aria-label="Открыть настройки «${views[view]}»"><img src="assets/settings-chevron.svg" width="5" height="12" alt=""></button>`;
}

function swatch(color, className = "") {
  return color === "transparent"
    ? `<span class="swatch transparent ${className}" aria-hidden="true"></span>`
    : `<span class="swatch ${className}" style="background:${color}" aria-hidden="true"></span>`;
}

function fontFamily(font) {
  return `"${font}", ${fontFallbacks[font] || "sans-serif"}`;
}

function fontPicker(path) {
  const selected = modelAt(path);
  return `<span class="font-picker" data-font-path="${path}">
    <button class="font-picker-trigger" type="button" data-text-styles aria-expanded="false" aria-controls="font-family-menu" aria-label="Шрифт: ${selected}" style='font-family:${fontFamily(selected)}'>${selected}</button>
    <span class="font-picker-menu" id="font-family-menu" role="group" aria-label="Выбор шрифта" hidden>
      ${fonts.map(font => `<button class="font-picker-option" type="button" data-font-option="${font}" aria-pressed="${font === selected}" style='font-family:${fontFamily(font)}'>${font}</button>`).join("")}
      <span class="font-picker-footer" aria-hidden="true"><span class="font-picker-more"><i></i><i></i><i></i></span></span>
    </span>
  </span>`;
}

const textAlignments = [["left", "По левому краю"], ["center", "По центру"], ["right", "По правому краю"], ["justify", "По ширине"]];

function alignmentPicker(path) {
  const selected = modelAt(path);
  return `<span class="alignment-control" data-alignment-path="${path}">
    <button class="alignment-trigger" type="button" data-text-styles aria-label="Выравнивание текста" aria-expanded="false" aria-controls="alignment-menu">
      <span class="alignment-icon" data-align="${selected}" aria-hidden="true"></span>
    </button>
    <span class="alignment-menu" id="alignment-menu" role="group" aria-label="Настройки выравнивания" hidden>
      ${textAlignments.map(([id, title]) => `<button class="alignment-option" type="button" data-alignment-option="${id}" aria-label="${title}" aria-pressed="${id === selected}"><span class="alignment-icon" data-align="${id}" aria-hidden="true"></span></button>`).join("")}
    </span>
  </span>`;
}

function fontControls(path, alignment = false) {
  const buttons = formats.map(([key, name, text]) =>
    `<button class="format ${key}" type="button" data-format="${path}.${key}" aria-label="${name}" aria-pressed="${modelAt(path)[key]}">${text}</button>`).join("");
  return `<div class="card font-card">
    <div class="font-heading"><strong>Шрифт</strong> ${textStylePicker("detail", path)}</div>
    <div class="row font-row">${fontPicker(path + ".font")}
    ${numberInput(path + ".fontSize", "Размер шрифта", 8, 72)}</div>
    <div class="row font-tools">${buttons}${alignment ? alignmentPicker(path + ".align") : ""}
    <span class="font-color">${textColorButton(path)}</span></div>
  </div>`;
}

function inlineIcon(id, width, height, className = "inline-icon") {
  return `<svg class="${className}" width="${width}" height="${height}" aria-hidden="true"><use href="#icon-${id}"></use></svg>`;
}

function footerIcon([id, , width, height]) {
  if (id === "validation") return '<span class="validation-icon">!</span>';
  if (id === "required") return "∗";
  return inlineIcon("footer-" + id, width, height);
}

function availableFooterOptions() {
  return footerOptions.filter(([id]) =>
    (id !== "hint" || canShowHint()) && !ui.added.has(id) &&
    (id !== "appearance" || !appearanceParts.every(hasAppearancePart)) &&
    (id !== "limits" || limitOptions.some(([key]) => !ui.added.has(key))));
}

function hasAppearancePart(part) {
  return ui.added.has("appearance") || ui.added.has(`appearance-${part}`);
}

function appearanceShortcut() {
  if (!separateAppearance) return null;
  const remaining = appearanceParts.filter(part => !hasAppearancePart(part));
  if (remaining.length !== 1) return null;
  const [part] = remaining;
  const options = {
    field: ["appearance", "Оформление области ввода", 18, 20],
    size: ["appearance-size", "Размер", 18, 18],
    label: ["appearance", "Оформление метки", 18, 20],
  };
  return { part, option: options[part] };
}

function appearanceMenuItems() {
  return appearanceParts.filter(part => !hasAppearancePart(part)).map(part =>
    `<button class="add-menu-item" type="button" data-appearance-part="${part}">${views[part]}</button>`).join("");
}

function appearanceCommand(option, labeled) {
  const shortcut = appearanceShortcut();
  if (shortcut) {
    return `<button class="command appearance-command" type="button" data-appearance-part="${shortcut.part}" title="${shortcut.option[1]}" aria-label="${shortcut.option[1]}">${commandContent(shortcut.option, labeled)}</button>`;
  }
  return footerPopup(option, appearanceMenuItems(), "Закрыть меню оформления", labeled);
}

function limitsMenuItems() {
  return limitOptions.filter(([id]) => !ui.added.has(id))
    .map(([id, title]) => `<button class="add-menu-item" type="button" data-add="${id}">${title}</button>`).join("");
}

function footerPopup(option, items, closeLabel, labeled) {
  const [id, title] = option;
  const menuId = id === "limits" ? "footer-limits-menu" : "appearance-menu";
  return `<span class="footer-popup-anchor">
    <button class="command ${id}-command" type="button" data-text-styles title="${title}" aria-label="${title}" aria-controls="${menuId}" aria-expanded="false">${commandContent(option, labeled)}</button>
    <span class="text-style-menu footer-popup" id="${menuId}" role="group" aria-labelledby="${menuId}-title" hidden>
      <span class="add-menu-header" id="${menuId}-title">${title}</span>
      <span class="add-menu-items">${items}</span>
      <button class="text-style-close" type="button" data-close-text-styles aria-label="${closeLabel}"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </span>
  </span>`;
}

function canShowHint() {
  return widget.label.placement === "left" || widget.label.placement === "above";
}

const labelPlacements = [
  ["left", "В метке слева", 9],
  ["above", "В метке сверху", 12],
  ["small-above", "С малой меткой сверху", 10],
  ["none", "Без метки", 11],
];

function labelPlacementPicker() {
  const selected = widget.label.placement;
  const icon = (placement, height) =>
    `<img src="assets/label-${placement === "none" ? "placement" : placement}.svg" width="20" height="${height}" alt="">`;
  const options = labelPlacements.map(([placement, title, height]) =>
    `<button class="add-menu-item label-placement-option" type="button"
      data-label-placement="${placement}" aria-pressed="${placement === selected}">
      <span class="menu-icon">${icon(placement, height)}</span>
      <span>${title}</span>
    </button>`);
  const [, title, height] = labelPlacements.find(([placement]) => placement === selected);
  return `<span class="label-placement">
    <button class="metadata-text-icon" type="button" data-text-styles data-placement="${selected}"
      aria-label="Расположение метки" title="${title}" aria-expanded="false"
      aria-controls="label-placement-menu">${icon(selected, height)}</button>
    <span class="text-style-menu label-placement-menu" id="label-placement-menu" role="group" aria-labelledby="label-placement-title" hidden>
      <span class="add-menu-header">
        <span id="label-placement-title">Отображение</span>
        <button class="add-menu-close" type="button" data-close-text-styles aria-label="Закрыть меню расположения метки"><img src="assets/close.svg" width="12" height="12" alt=""></button>
      </span>
      <span class="text-style-options">${options.slice(0, 2).join("")}</span>
      <span class="label-placement-heading">В области ввода</span>
      <span class="text-style-options">${options.slice(2).join("")}</span>
    </span>
  </span>`;
}

function metadataTextRow(id) {
  const { path, title, label, caption, remove } = metadataTextFields[id];
  return `<div class="metadata-text-row${id === "defaultValue" ? " default-value-row" : ""}">
    <span class="metadata-text-control${id === "label" ? " with-icon" : ""}"${id === "label" ? ` style="--label-text-color:${colorFill(widget.label.color, widget.label.colorAlpha ?? 100)}"` : ""}>
      ${textInput(path, label, title)}
      ${caption ? `<span class="metadata-text-caption" aria-hidden="true">${caption}</span>` : ""}
      ${id === "label" ? labelPlacementPicker() : ""}
    </span>
    ${remove ? `<button class="border-reset metadata-text-reset" type="button" data-remove-text="${id}" aria-label="${remove}"><img src="assets/border-reset.svg" width="9" height="9" alt=""></button>` : ""}
  </div>`;
}

function footerMenu() {
  return `<div class="add-menu" id="add-menu" role="group" aria-labelledby="add-menu-title">
    <div class="add-menu-header">
      <span id="add-menu-title">Добавить</span>
      <button class="add-menu-close" type="button" data-menu-close aria-label="Закрыть меню">${inlineIcon("close", 12, 12)}${inlineIcon("close-hover", 12, 12, "menu-close-hover")}</button>
    </div>
    <div class="add-menu-items">${availableFooterOptions().map(option => {
      const [id] = option;
      const shortcut = id === "appearance" ? appearanceShortcut() : null;
      const displayed = shortcut?.option ?? option;
      const hasSubmenu = id === "limits" || (id === "appearance" && separateAppearance && !shortcut);
      const submenuId = `${id}-submenu`;
      const action = shortcut ? `data-appearance-part="${shortcut.part}"`
        : `data-add="${id}"`;
      const item = `<button class="add-menu-item" type="button" ${action}${hasSubmenu ? ` aria-controls="${id === "limits" ? "limits-menu" : submenuId}"` : ""}>
        <span class="menu-icon" aria-hidden="true">${footerIcon(displayed)}</span>
        <span>${displayed[1]}</span>${hasSubmenu ? inlineIcon("footer-chevron", 7, 12, "menu-chevron") : ""}
      </button>`;
      if (id === "appearance" && hasSubmenu) return `<div class="limits-option">${item}
        <div class="limits-menu appearance-submenu" id="${submenuId}" role="group" aria-label="Свойства оформления">
          <div class="limits-menu-panel">${appearanceMenuItems()}</div>
        </div>
      </div>`;
      return hasSubmenu ? `<div class="limits-option">${item}
        <div class="limits-menu" id="limits-menu" role="group" aria-label="Ограничения">
          <div class="limits-menu-panel">${limitsMenuItems()}</div>
        </div>
      </div>` : item;
    }).join("")}</div>
  </div>`;
}

function presetTypography(key) {
  const { fontSize, fontWeight, italic } = textStylePresets[key];
  const { color, ...base } = typography("");
  return { ...base, fontSize, fontWeight, italic };
}

function applyTextPreset(style, key) {
  Object.assign(style, presetTypography(key), { textPreset: key });
  if ("align" in style) style.align = "left";
}

function fontOverrides(style, key) {
  const base = presetTypography(key);
  const changes = [];
  if (style.fontSize !== base.fontSize) changes.push(`Размер текста - ${style.fontSize}px`);
  if (style.bold !== base.bold) changes.push(`Жирность - ${style.bold ? "жирный" : "нормальная"}`);
  if (style.italic !== base.italic) changes.push(`Стиль текста - ${style.italic ? "курсив" : "нормальный"}`);
  if (style.underline !== base.underline || style.strike !== base.strike) {
    const decorations = [style.underline && "подчеркнутый", style.strike && "зачеркнутый"].filter(Boolean);
    changes.push(`Декорирование текста - ${decorations.join(", ") || "нет"}`);
  }
  if (style.align && style.align !== "left") {
    const [, title] = textAlignments.find(([value]) => value === style.align);
    changes.push(`Выравнивание - ${title.toLowerCase()}`);
  }
  if (style.font !== base.font) changes.push(`Шрифт - ${style.font}`);
  return changes;
}

function overrideNotice(changes, id, field = false) {
  if (!changes.length) return "";
  return `<span class="font-overrides${field ? " field-overrides" : ""}">
    <button class="font-overrides-trigger" type="button" aria-label="Параметры стиля переопределены" aria-describedby="${id}-changes"></button>
    <span class="font-overrides-panel">
      <button class="add-menu-close font-overrides-close" type="button" data-close-font-overrides aria-label="Закрыть подсказку"><img src="assets/close.svg" width="12" height="12" alt=""></button>
      <span class="font-overrides-heading">Изменены:</span>
      <span class="font-override-list" id="${id}-changes">${changes.map(change => `<span>${change}</span>`).join("")}</span>
      <span class="font-overrides-actions">
        ${field ? "" : '<span><i aria-hidden="true">&#xe62c;</i>Обновить текущий стиль</span><span><i aria-hidden="true">&#xe628;</i>Сохранить как новый</span>'}
        <button type="button" ${field ? "data-reset-field-overrides" : "data-reset-font-overrides"}><i aria-hidden="true">&#xe629;</i>Сбросить изменения</button>
      </span>
    </span>
  </span>`;
}

function textStylePicker(id, path) {
  const menuId = `${id}-style-menu`;
  const style = modelAt(path);
  const selected = style.textPreset || "main";
  const changes = fontOverrides(style, selected);
  const options = Object.entries(textStylePresets).map(([key, preset]) => {
    const active = key === selected;
    const overridden = active && changes.length;
    const attributes = `class="text-style-option${active ? " selected" : ""}${overridden ? " overridden" : ""}"`;
    return `<span role="listitem"><button type="button" ${attributes} data-text-preset="${key}" aria-pressed="${active}">
      <span style="font-size:${preset.fontSize}px;font-weight:${preset.fontWeight};font-style:${preset.italic ? "italic" : "normal"}">${preset.title}</span>
      ${overridden ? '<span class="text-style-override-note">Параметры стиля переопределены <i aria-hidden="true">&#xe64b;</i></span>' : ""}
    </button></span>`;
  }).join("");
  return `<span class="text-style-anchor" data-text-style-path="${path}" data-text-style-id="${id}">
    <button class="link text-style-link" type="button" data-text-styles aria-expanded="false" aria-controls="${menuId}">${textStylePresets[selected].title}</button>
    ${overrideNotice(changes, menuId)}
    <span class="text-style-menu" id="${menuId}" role="group" aria-label="Стили текста" hidden>
      <span class="text-style-options" role="list">
        ${options}
        <span class="text-style-option" role="listitem">Свой стиль</span>
      </span>
      <button class="text-style-close" type="button" data-close-text-styles aria-label="Закрыть список стилей"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </span>
  </span>`;
}

function refreshFontWarning(path) {
  const picker = content.querySelector(`[data-text-style-path="${path}"]`);
  if (picker) picker.outerHTML = textStylePicker(picker.dataset.textStyleId, path);
}

const fieldPresets = { transparent: "Прозрачное", filled: "Залитое" };

function fieldOverrides() {
  const changes = [];
  const lineNames = { solid: "сплошная", dashed: "пунктирная" };
  const colorText = (color, alpha) => color
    ? color.toUpperCase() + (alpha === 100 ? "" : `, ${alpha / 100}`) : "пусто";
  const pixels = values => values.every(value => value === values[0])
    ? `${values[0]}px` : values.map(value => `${value}px`).join(" / ");
  for (const [state, title] of states) {
    const style = widget.styles[state];
    const base = fieldGeometry(state, widget.preset);
    const add = text => changes.push(state === "rest" ? text : `${title}: ${text}`);
    const radii = style.radiusMode === "corners" ? style.cornerRadii : [style.radius];
    if (radii.some(radius => radius !== base.radius)) add(`Радиус скругления - ${pixels(radii)}`);
    if (style.borderColor !== base.borderColor || (style.borderColor && style.borderAlpha !== base.borderAlpha)) {
      add(`Границы - ${colorText(style.borderColor, style.borderAlpha)}`);
    }
    if (style.background !== base.background || (style.background && style.backgroundAlpha !== base.backgroundAlpha)) {
      add(`Фон - ${colorText(style.background, style.backgroundAlpha)}`);
    }
    if (style.shadow) {
      const { color, alpha, x, y, blur, spread } = style.shadow;
      const hexAlpha = Math.round(alpha * 255 / 100).toString(16).padStart(2, "0").toUpperCase();
      add(`Тень - ${color.toUpperCase()}${hexAlpha}, X:${x}, Y:${y}, Блюр:${blur}, Размах:${spread}`);
    }
    const borders = style.borderColor
      ? style.borderMode === "sides" ? style.borders : Array(4).fill(style.borderWidth) : [0, 0, 0, 0];
    if (borders.some((width, index) => width !== base.borders[index])) add(`Размер границы - ${pixels(borders)}`);
    if ((style.borderColor && style.borderLine) !== (base.borderColor && base.borderLine)) {
      add(`Стиль границы - ${style.borderColor ? lineNames[style.borderLine] : "пусто"}`);
    }
  }
  return changes;
}

function fieldPresetPicker() {
  const { color, colorAlpha = 100 } = widget.styles.rest;
  const changes = fieldOverrides();
  return `<span class="field-style-with-overrides"><span class="style-picker-shell" data-field-preset="${widget.preset}" style="color:${colorFill(color, colorAlpha)}">
    <button class="style-picker" type="button" data-text-styles aria-expanded="false" aria-controls="field-preset-menu">${fieldPresets[widget.preset]}</button>
    <span class="field-preset-menu" id="field-preset-menu" role="group" aria-label="Стиль поля" hidden>
      ${Object.entries(fieldPresets).map(([id, title]) => `
        <button class="field-preset-option" type="button" data-preset="${id}" aria-pressed="${id === widget.preset}"><span class="field-preset-title">${title}</span>${id === widget.preset && changes.length ? '<span class="text-style-override-note">Стиль изменен <i aria-hidden="true">&#xe64b;</i></span>' : ""}</button>
      `).join("")}
      <button class="text-style-close" type="button" data-close-text-styles aria-label="Закрыть меню стиля"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </span>
  </span>${overrideNotice(changes, "field-preset", true)}</span>`;
}

const sizeStepButtons = `
  <button class="step" type="button" data-step="-4" aria-label="Уменьшить высоту"><img src="assets/size-minus.svg" width="13" height="2" alt=""></button>
  <button class="step" type="button" data-step="4" aria-label="Увеличить высоту"><img src="assets/size-plus.svg" width="13" height="13" alt=""></button>
`;
document.querySelector(".header-size").innerHTML = sizeStepButtons;

function propertyReset(id, title) {
  return `<button class="example-close" type="button" data-remove-property="${id}" aria-label="Убрать «${title}»">&#xe66c;</button>`;
}

function examplePropertyCard(id, title, hint) {
  if (!ui.added.has(id)) return "";
  return `<div class="card example-property">
    <div class="example-property-title"><strong>${title}</strong>${propertyReset(id, title)}</div>
    <div class="example-property-body">${hint}${id !== "description" ? '<span class="example-formula-icon" aria-hidden="true">&#xe746;</span>' : ""}</div>
  </div>`;
}

function appearanceCard() {
  if (!appearanceParts.some(hasAppearancePart)) return "";
  const remove = part => separateAppearance
    ? `<button class="border-reset appearance-part-remove" type="button" data-remove-appearance-part="${part}" aria-label="Убрать настройку «${views[part]}»"><img src="assets/border-reset.svg" width="9" height="9" alt=""></button>`
    : "";
  return `<div class="card appearance"${separateAppearance ? ' aria-label="Оформление"' : ' aria-labelledby="appearance-title"'}>
    ${separateAppearance ? "" : `<div class="appearance-heading">
      <h3 id="appearance-title">Оформление</h3>
      <button class="border-reset" type="button" data-remove-appearance aria-label="Убрать оформление"><img src="assets/border-reset.svg" width="9" height="9" alt=""></button>
    </div>`}
    ${hasAppearancePart("field") ? row("Стиль", fieldPresetPicker() + remove("field") + arrow("field")) +
      row("Шрифт", textStylePicker("font", "styles.rest") + textColorButton("styles.rest")) : ""}
    ${hasAppearancePart("size") ? row("Размер", `<div class="size-steps">${sizeStepButtons}</div>` + remove("size") + arrow("size")) : ""}
    ${hasAppearancePart("label") ? row("Метка", textStylePicker("label", "label") + textColorButton("label") + remove("label") + arrow("label")) : ""}
  </div>`;
}

function mainView() {
  return `<div class="card metadata">
    ${metadataTextRow("label")}
    ${metadataTextRow("defaultValue")}
    ${ui.added.has("variable") ? `<div class="metadata-text-row">
      <button class="name-row" type="button" data-toggle-name aria-pressed="${Boolean(widget.name)}">
        <span>${widget.name || "Переменная"}</span>
        ${widget.name ? '<span class="name-caption">переменная</span>' : ""}
        <span class="name-icon" aria-hidden="true">&#xea90;</span>
      </button>
      <button class="border-reset metadata-text-reset" type="button" data-remove-variable aria-label="Убрать переменную"><img src="assets/border-reset.svg" width="9" height="9" alt=""></button>
    </div>` : ""}
    ${canShowHint() && ui.added.has("hint") ? metadataTextRow("hint") : ""}
  </div>
  ${["required", "multiline", "length", "pattern"].some(id => ui.added.has(id)) ? `<div class="card added-options">
    ${ui.added.has("required") ? `<div class="row">Заполнять обязательно${propertyReset("required", "Заполнять обязательно")}</div>` : ""}
    ${ui.added.has("multiline") ? `<div class="row">Многострочное <span>от</span><span class="example-number">1</span><span>до</span><span class="example-number example-hint">auto</span><span>строк</span>${propertyReset("multiline", "Многострочное")}</div>` : ""}
    ${ui.added.has("length") ? `<div class="row">Количество символов <span>до</span><span class="example-number">${widget.limitLength}</span>${propertyReset("length", "Количество символов")}</div>` : ""}
    ${ui.added.has("pattern") ? `<div class="row">
      <span class="pattern-picker">
        <button class="pattern-trigger" type="button" data-text-styles aria-controls="pattern-menu" aria-expanded="false">Регулярное выражение</button>
        <span class="text-style-menu position-menu pattern-menu" id="pattern-menu" role="group" aria-label="Вводимые символы" hidden>
          <span class="text-style-options">
            <span class="text-style-option" aria-disabled="true">Только буквы</span>
            <span class="text-style-option" aria-disabled="true">Без спецсимволов</span>
            <span class="text-style-option selected" aria-disabled="true" aria-current="true">Регулярное выражение</span>
          </span>
          <button class="text-style-close" type="button" data-close-text-styles aria-label="Закрыть меню"><img src="assets/close.svg" width="12" height="12" alt=""></button>
        </span>
      </span>${propertyReset("pattern", "Вводимые символы")}</div><div class="example-pattern example-hint">${escapeHtml(widget.limitPattern)}</div>` : ""}
  </div>` : ""}
  ${examplePropertyCard("description", "Описание", "Введите текст, который будет виден в окне подсказки")}
  ${examplePropertyCard("visibility", "Видимость", "Если формула вернет true, то поле появится")}
  ${examplePropertyCard("validation", "Валидация", "Проверка заполнения данных поможет исключить ошибки")}
  ${appearanceCard()}
  ${footerCommands()}`;
}

function commandContent(option, labeled) {
  return footerIcon(option) + (labeled ? `<span>${option[1]}</span>` : "");
}

function footerCommands() {
  const options = availableFooterOptions();
  if (!options.length) return "";
  const overflow = options.length > 5;
  const labeled = options.length <= 3;
  const commands = (overflow ? options.slice(0, 4) : options).map(option => {
    let [id, title] = option;
    let chip = option;
    if (id === "limits") {
      const remaining = limitOptions.filter(([key]) => !ui.added.has(key));
      if (remaining.length !== 1) return footerPopup(option, limitsMenuItems(), "Закрыть меню ограничений", labeled);
      [id, title] = remaining[0];
      chip = ["limits", title, option[2], option[3]];
    }
    if (id === "appearance" && separateAppearance) return appearanceCommand(option, labeled);
    return `<button class="command" type="button" data-add="${id}" title="${title}" aria-label="${title}">${commandContent(chip, labeled)}</button>`;
  }).join("");
  return `<div class="commands${labeled ? " commands-labeled" : ""}">
    ${commands}
    ${overflow ? `<div class="add-menu-anchor">
      <button class="command" type="button" data-menu-toggle aria-label="Добавить" aria-expanded="${Boolean(ui.menu)}"${ui.menu ? ' aria-controls="add-menu"' : ""}>${footerIcon(["more", "", 18, 5])}</button>
      ${ui.menu ? footerMenu() : ""}
    </div>` : ""}
  </div>`;
}

function radiusEditor(path, style) {
  const separate = style.radiusMode === "corners";
  const corners = [
    [0, "верхний левый", "top-left"],
    [1, "верхний правый", "top-right"],
    [3, "нижний левый", "bottom-left"],
    [2, "нижний правый", "bottom-right"],
  ];
  const editor = separate
    ? `<span class="radius-corners">${corners.map(([index, name, position]) =>
      `<label class="radius-corner" data-corner="${position}">${numberInput(path + ".cornerRadii." + index, "Радиус: " + name + " угол", 0, 999)}</label>`).join("")}</span>`
    : `<span class="radius-editor"><span class="geometry-icon" aria-hidden="true">&#xe95f;</span>${numberInput(path + ".radius", "Радиус скругления", 0, 999)}</span>`;
  return `<div class="row radius-row">
    <span class="row-label">Скругления</span>${editor}
    <button class="corners-icon" type="button" data-radius-mode aria-pressed="${separate}"
      aria-label="${separate ? "Все углы" : "По углам"}" title="${separate ? "Все углы" : "По углам"}"><img src="assets/radius-corners.svg" width="15" height="15" alt=""></button>
  </div>`;
}

function colorFill(color, alpha) {
  if (!color) return "transparent";
  return alpha === 100 ? color : `color-mix(in srgb, ${color} ${alpha}%, transparent)`;
}

function colorSettingSwatch(color, alpha) {
  if (!color) return '<img class="color-swatch" src="assets/border-no-color.svg" width="24" height="24" alt="">';
  if (alpha === 100) return swatch(color, "color-swatch");
  return `<span class="swatch color-swatch translucent-color" style="--opaque-color:${color};--translucent-color:${colorFill(color, alpha)}" aria-hidden="true"></span>`;
}

function textColorButton(path) {
  const { color, colorAlpha = 100 } = modelAt(path);
  const label = path === "label" ? "Цвет метки" : "Цвет текста";
  return `<button class="field-color-trigger" type="button" data-text-color="${path}"
    aria-haspopup="dialog" aria-label="${label}" title="${color.toUpperCase()}">${colorSettingSwatch(color, colorAlpha)}</button>`;
}

function fieldColorButton(action, name, color, opacity) {
  const label = color ? color.toUpperCase() + (opacity < 100 ? `, ${opacity / 100}` : "") : "";
  return `<button class="field-color-trigger" type="button" data-${action}
    aria-haspopup="dialog" aria-label="${name}: ${label || "Без цвета"}"
    title="${label || "Без цвета"}"${color ? ` style="--field-color-value:${color}"` : ""}>
    ${colorSettingSwatch(color, opacity)}${color ? `<span class="field-color-code">${label}</span>` : ""}
  </button>`;
}

function backgroundEditor(style) {
  return fieldColorButton("background-color", "Фон поля", style.background, style.backgroundAlpha) +
    (style.background ? '<button class="border-reset field-color-reset" type="button" data-background-reset aria-label="Убрать фон"><img src="assets/border-reset.svg" width="9" height="9" alt=""></button>' : "");
}

function shadowEditor(shadow) {
  const trigger = fieldColorButton("open-shadow", "Тень", shadow?.color, shadow?.alpha);
  const clear = shadow ? '<button class="border-reset field-color-reset" type="button" data-shadow-action="remove" aria-label="Убрать тень"><img src="assets/border-reset.svg" width="9" height="9" alt=""></button>' : "";
  const popup = shadowDraft ? shadowPopup() : "";
  return `<div class="shadow-setting">${row("Тень", trigger + clear)}${popup}</div>`;
}

function shadowPopup() {
  return `<section class="shadow-popup" role="dialog" aria-label="Тень">
    <header class="shadow-heading">
      <strong>Тень</strong>
      <button class="shadow-reset" type="button" data-shadow-action="reset" aria-label="Сбросить изменения тени">&#xe629;</button>
      <button class="shadow-apply" type="button" data-shadow-action="apply" aria-label="Применить тень"><img src="assets/save.svg" width="14" height="11" alt=""></button>
      <button type="button" data-shadow-action="cancel" aria-label="Отменить настройку тени"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </header>
    <div class="shadow-controls">
      ${row("Цвет", fieldColorButton("shadow-color", "Цвет тени", shadowDraft.color, shadowDraft.alpha))}
      ${shadowParameters.map(([key, label, min]) => `<div class="row shadow-parameter">
        <span class="row-label">${label}</span>
        <input type="range" data-shadow-param="${key}" min="${min}" max="10" value="${shadowDraft[key]}" aria-label="${label}: ползунок">
        <input type="number" data-shadow-param="${key}" min="${min}" max="10" value="${shadowDraft[key]}" aria-label="${label}: значение">
      </div>`).join("")}
    </div>
  </section>`;
}

function borderEditor(path, style) {
  const separate = style.borderMode === "sides";
  const options = [["solid", "Сплошная"], ["dashed", "Пунктирная"]];
  const color = style.borderColor;
  return `<div class="row border-row">
    <span class="row-label">Границы</span>
    <button class="field-color-trigger" type="button" data-border-color aria-haspopup="dialog"
      aria-label="${color ? "Цвет границ" : "Без цвета"}" title="${color || "Без цвета"}">${colorSettingSwatch(color, style.borderAlpha)}</button>
    ${color ? `<span class="border-line-control">
      <button class="border-line-button" type="button" data-text-styles aria-label="Тип линии" aria-controls="border-line-menu" aria-expanded="false"><span class="border-line ${style.borderLine}"></span></button>
      <span class="border-line-menu" id="border-line-menu" role="group" aria-label="Тип линии" hidden>
        ${options.map(([id, title]) => `<button type="button" data-border-line="${id}" aria-label="${title}" aria-pressed="${style.borderLine === id}"><span class="border-line ${id}"></span></button>`).join("")}
      </span>
    </span>
    ${separate ? sideInputs(path + ".borders", "Толщина границы", 12) : numberInput(path + ".borderWidth", "Толщина границы", 0, 12)}
    <button class="border-reset" type="button" data-border-reset aria-label="Убрать границы"><img src="assets/border-reset.svg" width="9" height="9" alt=""></button>
    <button class="border-mode" type="button" data-border-mode aria-pressed="${separate}" aria-label="${separate ? "Все стороны" : "По сторонам"}">&#xebce;</button>` : ""}
  </div>`;
}

function fieldView() {
  const path = "styles." + ui.state;
  const style = widget.styles[ui.state];
  const tabs = states.map(([state, name]) =>
    `<button type="button" data-state="${state}" aria-pressed="${ui.state === state}">${name}</button>`).join("");
  return `<div class="tabs" role="group" aria-label="Состояние поля">${tabs}</div>
  <div class="card field-geometry">
    ${radiusEditor(path, style)}
    ${borderEditor(path, style)}
  </div>
  <div class="card field-effects">
    ${row("Фон", backgroundEditor(style))}
    ${shadowEditor(style.shadow)}
  </div>${fontControls(path, true)}`;
}

function labelView() {
  return `${fontControls("label")}
    <div class="card">${row("Отступ до поля", numberInput("label.gap", "Отступ до поля", 0, 60))}</div>`;
}

const dimensionModes = {
  fixed: ["фиксированная", "px"],
  relative: ["относительная", "%"],
  auto: ["по контенту", "auto"],
  fill: ["заполнить"],
};

function dimensionModePicker(dimension, label) {
  const menuId = `size-mode-${dimension}`;
  const selected = widget.size.dimensionModes[dimension];
  const [name, unit] = dimensionModes[selected];
  const title = selected === "fixed" || selected === "relative" ? unit : name;
  const noun = dimension === "width" ? "ширину" : "высоту";
  return `<span class="dimension-mode">
    <button class="dimension-mode-trigger" type="button" data-text-styles aria-expanded="false"
      aria-controls="${menuId}" aria-label="${label}: ${title}">${title}</button>
    <span class="text-style-menu dimension-mode-menu" id="${menuId}" data-dimension="${dimension}" role="group" aria-label="${label}" hidden>
      <span class="text-style-options">
        ${Object.entries(dimensionModes).map(([mode, [name, unit]]) => {
          const caption = unit ? `${name} (${unit})` : name;
          if (mode === "relative") return `<span class="text-style-option">${caption}</span>`;
          return `<button class="text-style-option${mode === selected ? " selected" : ""}" type="button"
            data-dimension-mode="${mode}" aria-pressed="${mode === selected}">${caption}</button>`;
        }).join("")}
        <span class="dimension-mode-heading">Добавить</span>
        <span class="text-style-option">Min ${noun}</span>
        <span class="text-style-option">Max ${noun}</span>
      </span>
      <button class="text-style-close" type="button" data-close-text-styles aria-label="Закрыть меню"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </span>
  </span>`;
}

function spacingSides({ x, y, sides: values, expanded }) {
  return expanded ? values : [y, x, y, x];
}

function heightExtras() {
  const [top, , bottom] = spacingSides(widget.size.inner);
  return top + bottom + labelRowHeight();
}

function dimensionHints() {
  const { dimensionModes, heightHint, outlineWidth } = widget.size;
  const style = widget.styles[ui.view === "field" ? ui.state : "rest"];
  const fontSize = widget.label.text && widget.label.placement === "left"
    ? Math.max(style.fontSize, widget.label.fontSize) : style.fontSize;
  const [top, , bottom] = style.borderMode === "sides" ? style.borders : [style.borderWidth, 0, style.borderWidth];
  const contentHeight = Math.ceil(fontSize * 1.2) + (style.borderColor ? top + bottom : 0);
  return {
    width: dimensionModes.width === "auto" ? contentWidth : outlineWidth,
    height: (dimensionModes.height === "auto" ? Math.max(heightHint, contentHeight) : heightHint) + heightExtras(),
  };
}

function previewDimensions() {
  const { size } = widget;
  const hints = dimensionHints();
  if (size.width !== null) hints.width = size.width;
  if (size.height !== null) hints.height = size.height + heightExtras() - size.heightOffset;
  return hints;
}

function setDimensionMode(dimension, mode) {
  widget.size.dimensionModes[dimension] = mode;
  const picker = content.querySelector(`#size-mode-${dimension}`)?.parentElement;
  if (picker) picker.outerHTML = dimensionModePicker(dimension, dimension === "width" ? "Режим ширины" : "Режим высоты");
}

function labelRowHeight() {
  const { text, placement } = widget.label;
  if (!text || placement === "left" || placement === "none") return 0;
  return placement === "above" ? 24 : 16;
}

function dimensionControl(dimension, label, min, max) {
  const placeholder = dimensionHints()[dimension];
  return `<span class="dimension-control">${numberInput("size." + dimension, label, min, max, placeholder)}${dimensionModePicker(dimension, dimension === "width" ? "Режим ширины" : "Режим высоты")}</span>`;
}

function spacingControl(path, label, max, vertical = false) {
  const icon = vertical ? "spacing-vertical.svg" : "spacing-horizontal.svg";
  return `<span class="spacing-control"><img class="spacing-icon" src="assets/${icon}" width="12" height="12" alt="">${numberInput(path, label, 0, max)}</span>`;
}

function positionPicker(axis, label, start, end) {
  const options = { default: "По умолчанию", start, center: "По центру", end };
  const selected = widget.size[axis];
  const menuId = `size-position-${axis}`;
  return `<span class="text-style-anchor">
    <button class="link text-style-link position-trigger" type="button" data-text-styles
      aria-expanded="false" aria-controls="${menuId}" aria-label="${label}: ${options[selected]}">${options[selected]}</button>
    <span class="text-style-menu position-menu" id="${menuId}" role="group" aria-label="${label}" hidden>
      <span class="text-style-options" role="list">
        ${Object.entries(options).map(([value, title]) => `<span class="text-style-option${value === selected ? " selected" : ""}" role="listitem"${value === selected ? ' aria-current="true"' : ""}>${title}</span>`).join("")}
      </span>
      <button class="text-style-close" type="button" data-close-text-styles aria-label="Закрыть меню положения"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </span>
  </span>`;
}

function spacingEditor(key, title, label, max, horizontalOnly = false) {
  const path = "size." + key;
  const { expanded } = widget.size[key];
  const fields = expanded
    ? sideInputs(path + ".sides", label, max, horizontalOnly)
    : spacingControl(path + ".x", label + (horizontalOnly ? "" : " по горизонтали"), max) +
      (horizontalOnly ? "" : spacingControl(path + ".y", label + " по вертикали", max, true));
  const toggleLabel = horizontalOnly
    ? `Отступы в поле: ${expanded ? "общее значение" : "по сторонам"}`
    : `${title} отступы: ${expanded ? "по осям" : "по сторонам"}`;
  return `<div class="row spacing-editor-row">
    <span class="row-label">${title}</span>${fields}
    <button class="spacing-toggle" type="button" data-spacing-toggle="${key}"
      aria-label="${toggleLabel}" aria-pressed="${expanded}">&#xebce;</button>
  </div>`;
}

function sizeView() {
  return `<div class="card size-position">
    <strong class="size-card-heading">Положение</strong>
    ${row("По вертикали", positionPicker("vertical", "Положение по вертикали", "Сверху", "Снизу"))}
    ${row("По горизонтали", positionPicker("horizontal", "Положение по горизонтали", "Слева", "Справа"))}
  </div>
  <div class="card size-dimensions">
    ${row("Ширина", dimensionControl("width", "Ширина поля", 80, 700))}
    ${row("Высота", dimensionControl("height", "Высота поля", 24, 200))}
  </div>
  <div class="card size-spacing">
    <strong class="size-card-heading">Отступы</strong>
    ${spacingEditor("outer", "Внешние", "Внешний отступ", 64)}
    ${spacingEditor("inner", "Внутренние", "Внутренний отступ", 40)}
    ${spacingEditor("inset", "В поле", "Отступ текста в поле", 40, true)}
  </div>`;
}

const renderView = { main: mainView, field: fieldView, label: labelView, size: sizeView };

function showSettings(focusSelector) {
  const title = document.querySelector("#window-title");
  const isMain = ui.view === "main";
  document.querySelector(".settings").classList.toggle("detail-settings", !isMain);
  title.textContent = isMain ? widgetTypes[widget.type].title : views[ui.view];
  title.hidden = !isMain;
  title.classList.toggle("is-main", isMain);
  document.querySelector(".detail-heading").hidden = isMain;
  document.querySelector(".detail-title").textContent = views[ui.view];
  document.querySelector(".header-size").hidden = ui.view !== "size";
  content.dataset.view = ui.view;
  content.innerHTML = renderView[ui.view]();
  positionAddMenu();
  syncShadowControls();
  if (focusSelector) document.querySelector(focusSelector)?.focus();
}

function applyTypography(element, style) {
  element.style.fontFamily = fontFamily(style.font);
  element.style.fontSize = style.fontSize + "px";
  element.style.fontWeight = style.bold ? "bold" : style.fontWeight ?? 400;
  element.style.fontStyle = style.italic ? "italic" : "normal";
  element.style.textDecoration = [style.underline && "underline", style.strike && "line-through"].filter(Boolean).join(" ") || "none";
  element.style.color = colorFill(style.color, style.colorAlpha ?? 100);
}

function updatePreview() {
  const state = ui.view === "field" ? ui.state : "rest";
  const style = widget.styles[state];
  const { size, label } = widget;
  const required = ui.added.has("required");
  const [outerTop, outerRight, outerBottom, outerLeft] = spacingSides(size.outer);
  const [innerTop, innerRight, innerBottom, innerLeft] = spacingSides(size.inner);
  const dimensions = previewDimensions();
  const labelHeight = labelRowHeight();
  const labelAbove = labelHeight > 0 && label.placement === "above";
  layout.classList.toggle("with-label-above", labelAbove);
  size.outlineWidth = Math.max(size.outlineWidth, dimensions.width);
  layout.style.width = size.outlineWidth + "px";
  previewFrame.style.width = `${dimensions.width - 2}px`;
  resetWidgetButton.disabled = !ui.added.size && JSON.stringify(widget) === defaultWidget;
  const horizontal = size.horizontal === "default" ? "start" : size.horizontal;
  previewFrame.style.maxWidth = `calc(100% - ${outerLeft + outerRight + 2}px)`;
  previewFrame.style.marginInline = {
    start: `${outerLeft + 1}px auto`,
    center: "auto",
    end: `auto ${outerRight + 1}px`,
  }[horizontal];
  previewFrame.style.marginBlock = `${outerTop}px ${outerBottom}px`;
  previewFrame.style.height = dimensions.height + "px";
  previewFrame.style.paddingBlock = `${innerTop}px ${innerBottom}px`;
  previewFrame.style.paddingInline = `${innerLeft}px ${innerRight}px`;
  preview.style.alignItems = size.vertical === "default" ? "center" : size.vertical;
  preview.style.gap = label.gap + "px";
  previewInputWrap.style.borderRadius = style.radiusMode === "corners"
    ? style.cornerRadii.map(radius => radius + "px").join(" ")
    : style.radius + "px";
  previewInputWrap.style.borderStyle = style.borderLine;
  previewInputWrap.style.borderColor = colorFill(style.borderColor, style.borderAlpha);
  previewInputWrap.style.borderWidth = !style.borderColor ? "0px" : style.borderMode === "sides"
    ? style.borders.map(width => width + "px").join(" ") : style.borderWidth + "px";
  previewInputWrap.style.setProperty("--preview-input-border-width", previewInputWrap.style.borderBottomWidth);
  previewInputWrap.style.background = colorFill(style.background, style.backgroundAlpha);
  const shadow = ui.view === "field" && shadowDraft ? shadowDraft : style.shadow;
  previewInputWrap.style.boxShadow = shadow
    ? `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${colorFill(shadow.color, shadow.alpha)}`
    : "none";
  preview.dataset.state = state;
  preview.setAttribute("aria-label", widget.name || "Предпросмотр текстового поля");
  const floatingLabel = label.placement === "small-above";
  previewFrame.dataset.placement = label.placement;
  const labelContainer = labelHeight ? previewFrame : previewText.closest(".widget-content");
  if (previewLabel.parentElement !== labelContainer) labelContainer.prepend(previewLabel);
  previewLabel.textContent = label.text;
  previewLabel.hidden = !label.text || label.placement === "none";
  const defaultPlaceholder = widgetTypes[widget.type].placeholder;
  const placeholder = (canShowHint() && widget.placeholder) || defaultPlaceholder;
  const showNameAsPlaceholder = floatingLabel || label.placement === "none";
  previewText.placeholder = (showNameAsPlaceholder && label.text) || placeholder;
  previewText.required = required;
  previewText.style.setProperty("--preview-placeholder-color", colorFill(label.color, 60));
  previewText.setAttribute("aria-label", label.text || widget.name || "Предпросмотр текстового поля");
  const [, insetRight, , insetLeft] = spacingSides(size.inset);
  previewText.style.paddingInline = `${insetLeft}px ${insetRight}px`;
  previewText.style.textAlign = style.align;
  applyTypography(previewText, style);
  applyTypography(previewLabel, label);
  if (floatingLabel) previewLabel.style.fontSize = "12px";
  if (ui.view === "size") {
    for (const [dimension, hint] of Object.entries(dimensionHints())) {
      content.querySelector(`[data-model="size.${dimension}"]`).placeholder = hint;
    }
  }
}

function applyPreset(preset, resetInset = true) {
  const filled = preset === "filled";
  for (const [state, style] of Object.entries(widget.styles)) {
    Object.assign(style, fieldGeometry(state, preset));
  }
  if (!resetInset) return;
  const inset = filled ? 4 : 0;
  widget.size.inset.x = inset;
  widget.size.inset.sides = [0, inset, 0, inset];
}

function syncShadowControls(source) {
  if (!shadowDraft) return;
  const initial = widget.styles[ui.state].shadow || defaultShadow;
  const reset = content.querySelector('[data-shadow-action="reset"]');
  reset.disabled = Object.keys(defaultShadow).every(key => shadowDraft[key] === initial[key]);
  for (const input of content.querySelectorAll("[data-shadow-param]")) {
    const value = shadowDraft[input.dataset.shadowParam];
    if (input !== source) input.value = value;
    if (input.type === "range") {
      input.style.setProperty("--shadow-range-progress", (value - Number(input.min)) / (10 - Number(input.min)) * 100 + "%");
    }
  }
}

function updateModel(event) {
  const input = event.target;
  if (input.dataset.shadowParam && shadowDraft) {
    const key = input.dataset.shadowParam;
    if (Number.isFinite(input.valueAsNumber)) {
      shadowDraft[key] = Math.round(Math.min(Number(input.max), Math.max(Number(input.min), input.valueAsNumber)));
    }
    syncShadowControls(event.type === "input" ? input : undefined);
    updatePreview();
    return;
  }
  const path = input.dataset.model;
  if (!path || (event.type === "input" && input.tagName === "SELECT")) return;
  const previous = modelAt(path);
  const dimension = path === "size.width" ? "width" : path === "size.height" ? "height" : null;
  if (input.type === "number") {
    const committed = event.type === "change";
    if (input.value === "" && input.hasAttribute("placeholder") && !input.validity.badInput) {
      setModel(path, null);
      if (dimension === "height") widget.size.heightOffset = 0;
      updatePreview();
      return;
    }
    if (input.value === "" && !committed) return;
    const number = input.value === "" ? modelAt(path) : Math.max(+input.min, Math.min(+input.max, input.valueAsNumber));
    if (!Number.isFinite(number)) return;
    setModel(path, number);
    if (dimension && event.type === "input") {
      if (dimension === "height") widget.size.heightOffset = heightExtras();
      if (widget.size.dimensionModes[dimension] !== "fixed") setDimensionMode(dimension, "fixed");
    }
    if (committed) input.value = number;
  } else {
    setModel(path, input.value);
    if (path === "defaultValue" && event.type === "input") previewText.value = input.value;
  }
  if (path.endsWith(".fontSize") && modelAt(path) !== previous) {
    refreshFontWarning(path.slice(0, -".fontSize".length));
  }
  updatePreview();
}

const stage = document.querySelector(".settings-stage");
const systemViewInputs = document.querySelectorAll('input[name="system-view"]');

function loadSystemView(view) {
  colorDialog.close();
  shadowDraft = null;
  widget = createWidget(widget.type);
  Object.assign(ui, { view: "main", state: "rest", menu: "" });
  ui.added.clear();
  if (view === "maximum") {
    for (const [id] of [...footerOptions, ...limitOptions]) {
      if (id !== "limits") ui.added.add(id);
    }
    if (separateAppearance) {
      ui.added.delete("appearance");
      for (const part of appearanceParts) ui.added.add(`appearance-${part}`);
    }
    Object.assign(widget, {
      name: "Организация.Название",
      defaultValue: "Микропредприятие",
      placeholder: "Любые важные детали",
    });
    Object.assign(widget.label, { text: "Примечание", placement: "left" });
  }
  previewText.value = widget.defaultValue;
  for (const input of systemViewInputs) input.checked = input.value === view;
  showSettings();
  updatePreview();
}

for (const input of systemViewInputs) input.addEventListener("change", () => {
  if (input.checked) loadSystemView(input.value);
});

for (const input of document.querySelectorAll('input[name="appearance-mode"]')) {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    separateAppearance = input.value === "separate";
    if (separateAppearance && ui.added.delete("appearance")) {
      for (const part of appearanceParts) ui.added.add(`appearance-${part}`);
    } else if (!separateAppearance && appearanceParts.some(hasAppearancePart)) {
      for (const part of appearanceParts) ui.added.delete(`appearance-${part}`);
      ui.added.add("appearance");
    }
    ui.menu = "";
    showSettings();
    updatePreview();
  });
}

function resetAppearancePart(part, defaults) {
  if (part === "field") {
    widget.preset = defaults.preset;
    widget.styles = defaults.styles;
  } else if (part === "size") {
    widget.size = defaults.size;
  } else {
    const { text, placement } = widget.label;
    widget.label = { ...defaults.label, text, placement };
  }
}

function clearMaximumSelection() {
  document.querySelector('input[name="system-view"][value="maximum"]').checked = false;
}

stage.addEventListener("input", updateModel);
stage.addEventListener("change", updateModel);
stage.addEventListener("pointerover", event => {
  const notice = event.target.closest(".font-overrides");
  if (notice && !notice.contains(event.relatedTarget)) positionFontNotice(notice);
});
stage.addEventListener("pointerout", event => {
  const notice = event.target.closest(".font-overrides");
  if (notice && !notice.contains(event.relatedTarget)) delete notice.dataset.dismissed;
});
stage.addEventListener("focusin", event => {
  const notice = event.target.closest(".font-overrides");
  if (notice && !notice.contains(event.relatedTarget)) {
    delete notice.dataset.dismissed;
    positionFontNotice(notice);
  }
});

function positionFontNotice(notice) {
  delete notice.dataset.below;
  const panel = notice.querySelector(".font-overrides-panel");
  if (panel.getBoundingClientRect().top < 8) notice.dataset.below = "true";
}

stage.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  const { view, state, format, step } = button.dataset;
  if ("resetWidget" in button.dataset) {
    loadSystemView("initial");
    return;
  } else if (view) {
    colorDialog.close();
    shadowDraft = null;
    const previousView = ui.view;
    ui.view = view;
    if (view === "field") ui.state = "rest";
    const focusSelector = view === "main"
      ? `.arrow[data-view="${previousView}"]`
      : ".detail-back";
    showSettings(focusSelector);
  } else if (state) {
    colorDialog.close();
    shadowDraft = null;
    ui.state = state;
    showSettings(`[data-state="${state}"]`);
  } else if (format) {
    setModel(format, !modelAt(format));
    button.setAttribute("aria-pressed", modelAt(format));
    refreshFontWarning(format.slice(0, format.lastIndexOf(".")));
  } else if ("closeFontOverrides" in button.dataset) {
    const notice = button.closest(".font-overrides");
    notice.dataset.dismissed = "true";
    notice.parentElement.querySelector(".text-style-link, .style-picker").focus();
  } else if ("resetFieldOverrides" in button.dataset) {
    applyPreset(widget.preset, false);
    showSettings(".style-picker");
  } else if ("resetFontOverrides" in button.dataset) {
    const picker = button.closest("[data-text-style-path]");
    const style = modelAt(picker.dataset.textStylePath);
    applyTextPreset(style, style.textPreset || "main");
    showSettings(`[aria-controls="${picker.dataset.textStyleId}-style-menu"]`);
  } else if ("removeAppearance" in button.dataset) {
    clearMaximumSelection();
    const defaults = createWidget(widget.type);
    for (const part of appearanceParts) resetAppearancePart(part, defaults);
    ui.state = "rest";
    ui.added.delete("appearance");
    showSettings('.commands [data-add="appearance"]');
  } else if (button.dataset.removeAppearancePart) {
    clearMaximumSelection();
    const part = button.dataset.removeAppearancePart;
    ui.added.delete(`appearance-${part}`);
    resetAppearancePart(part, createWidget(widget.type));
    showSettings(".appearance-command");
  } else if (button.dataset.appearancePart) {
    const part = button.dataset.appearancePart;
    ui.added.add(`appearance-${part}`);
    ui.menu = "";
    showSettings(`[data-remove-appearance-part="${part}"]`);
  } else if (button.dataset.removeProperty) {
    clearMaximumSelection();
    const id = button.dataset.removeProperty;
    ui.added.delete(id);
    showSettings(limitOptions.some(([key]) => key === id) ? `.commands [data-add="${id}"], .limits-command` : `.commands [data-add="${id}"]`);
  } else if (button.dataset.removeText) {
    clearMaximumSelection();
    const id = button.dataset.removeText;
    ui.added.delete(id);
    setModel(metadataTextFields[id].path, "");
    showSettings(`.commands [data-add="${id}"]`);
  } else if (button.dataset.labelPlacement) {
    widget.label.placement = button.dataset.labelPlacement;
    showSettings(".metadata-text-icon");
  } else if (button.dataset.dimensionMode) {
    const menu = button.closest(".dimension-mode-menu");
    const { dimension } = menu.dataset;
    const mode = button.dataset.dimensionMode;
    if (mode === "fixed") {
      if (widget.size[dimension] === null) {
        widget.size[dimension] = dimensionHints()[dimension];
        if (dimension === "height") widget.size.heightOffset = heightExtras();
      }
    } else {
      widget.size[dimension] = null;
      if (dimension === "height") widget.size.heightOffset = 0;
    }
    widget.size.dimensionModes[dimension] = mode;
    showSettings(`[aria-controls="${menu.id}"]`);
  } else if ("toggleName" in button.dataset) {
    widget.name = widget.name ? "" : "Организация.Название";
    showSettings("[data-toggle-name]");
  } else if ("removeVariable" in button.dataset) {
    clearMaximumSelection();
    widget.name = "";
    ui.added.delete("variable");
    showSettings('.commands [data-add="variable"]');
  } else if (step) {
    const previousHeight = widget.size.height === null
      ? widget.size.heightHint : widget.size.height - widget.size.heightOffset;
    const nextHeight = Math.max(defaultSize.height, Math.min(200, previousHeight + Number(step)));
    if (nextHeight !== previousHeight) {
      widget.size.height = null;
      widget.size.heightOffset = 0;
      widget.size.heightHint = nextHeight;
      if (widget.size.dimensionModes.height === "fixed") setDimensionMode("height", "auto");
      const heightInput = content.querySelector('[data-model="size.height"]');
      if (heightInput) {
        heightInput.value = "";
      }
    }
  } else if (button.dataset.spacingToggle) {
    const key = button.dataset.spacingToggle;
    const spacing = widget.size[key];
    if (spacing.expanded) {
      spacing.x = spacing.sides[3];
      spacing.y = spacing.sides[0];
    } else {
      spacing.sides = spacingSides(spacing);
    }
    spacing.expanded = !spacing.expanded;
    showSettings(`[data-spacing-toggle="${key}"]`);
  } else if ("textStyles" in button.dataset) {
    const open = button.getAttribute("aria-expanded") === "false";
    const previous = content.querySelector('[data-text-styles][aria-expanded="true"]');
    if (previous) setTextStyleMenu(previous, false);
    if (open) setTextStyleMenu(button, true);
  } else if ("closeTextStyles" in button.dataset) {
    const trigger = content.querySelector(`[aria-controls="${button.closest("[id]").id}"]`);
    setTextStyleMenu(trigger, false);
    trigger.focus();
  } else if (button.dataset.textColor) {
    const path = button.dataset.textColor;
    const style = modelAt(path);
    const label = path === "label";
    colorDialog.open(button, {
      title: label ? "Метка" : "Текст",
      palette: textColorPalettes[label ? "label" : "text"],
      value: { color: style.color, alpha: style.colorAlpha ?? 100 },
      onConfirm: ({ color, alpha }) => {
        Object.assign(style, { color, colorAlpha: alpha });
        showSettings(`[data-text-color="${path}"]`);
        updatePreview();
      },
    });
  } else if ("borderColor" in button.dataset) {
    const style = widget.styles[ui.state];
    colorDialog.open(button, { title: "Границы", value: { color: style.borderColor, alpha: style.borderAlpha }, onConfirm: value => {
      if (!style.borderColor) {
        style.borderMode = "unified";
        style.borderWidth = 1;
        style.borders.fill(1);
        style.borderLine = "solid";
      }
      style.borderColor = value.color;
      style.borderAlpha = value.alpha;
      showSettings("[data-border-color]");
      updatePreview();
    } });
  } else if ("backgroundColor" in button.dataset) {
    const style = widget.styles[ui.state];
    colorDialog.open(button, { title: "Фон", value: { color: style.background, alpha: style.backgroundAlpha }, onConfirm: value => {
      style.background = value.color;
      style.backgroundAlpha = value.alpha;
      showSettings("[data-background-color]");
      updatePreview();
    } });
  } else if ("openShadow" in button.dataset) {
    shadowDraft = { ...(widget.styles[ui.state].shadow || defaultShadow) };
    showSettings('[data-shadow-action="cancel"]');
  } else if ("shadowColor" in button.dataset) {
    const editedShadow = shadowDraft;
    colorDialog.open(button, { title: "Цвет", value: editedShadow, onConfirm: ({ color, alpha }) => {
      if (shadowDraft !== editedShadow) return;
      Object.assign(shadowDraft, { color, alpha });
      showSettings("[data-shadow-color]");
      updatePreview();
    } });
  } else if (button.dataset.shadowAction) {
    const style = widget.styles[ui.state];
    const action = button.dataset.shadowAction;
    if (action === "reset") {
      shadowDraft = { ...(style.shadow || defaultShadow) };
      showSettings("[data-shadow-color]");
    } else {
      if (action === "apply") style.shadow = { ...shadowDraft };
      if (action === "remove") style.shadow = null;
      shadowDraft = null;
      showSettings("[data-open-shadow]");
    }
  } else if ("backgroundReset" in button.dataset) {
    const style = widget.styles[ui.state];
    style.background = null;
    style.backgroundAlpha = 100;
    showSettings("[data-background-color]");
  } else if ("borderReset" in button.dataset) {
    widget.styles[ui.state].borderColor = null;
    showSettings("[data-border-color]");
  } else if ("borderMode" in button.dataset) {
    const style = widget.styles[ui.state];
    if (style.borderMode === "sides") {
      style.borderWidth = style.borders[0];
      style.borderMode = "unified";
    } else {
      style.borders.fill(style.borderWidth);
      style.borderMode = "sides";
    }
    showSettings("[data-border-mode]");
  } else if (button.dataset.borderLine) {
    widget.styles[ui.state].borderLine = button.dataset.borderLine;
    showSettings(".border-line-button");
  } else if ("radiusMode" in button.dataset) {
    const style = widget.styles[ui.state];
    const separate = style.radiusMode === "unified";
    style.radiusMode = separate ? "corners" : "unified";
    if (separate) style.cornerRadii.fill(style.radius);
    showSettings("[data-radius-mode]");
  } else if (button.dataset.fontOption) {
    setModel(button.closest(".font-picker").dataset.fontPath, button.dataset.fontOption);
    showSettings(".font-picker-trigger");
  } else if (button.dataset.alignmentOption) {
    setModel(button.closest(".alignment-control").dataset.alignmentPath, button.dataset.alignmentOption);
    showSettings(".alignment-trigger");
  } else if (button.dataset.textPreset) {
    const key = button.dataset.textPreset;
    const picker = button.closest("[data-text-style-path]");
    const style = modelAt(picker.dataset.textStylePath);
    const menuId = picker.querySelector("[data-text-styles]").getAttribute("aria-controls");
    applyTextPreset(style, key);
    showSettings(`[aria-controls="${menuId}"]`);
  } else if (button.dataset.preset) {
    widget.preset = button.dataset.preset;
    applyPreset(widget.preset);
    showSettings('[aria-controls="field-preset-menu"]');
  } else if ("menuToggle" in button.dataset) {
    ui.menu = ui.menu ? "" : "add";
    showSettings(event.detail === 0 && ui.menu ? ".add-menu-item" : "[data-menu-toggle]");
  } else if ("menuClose" in button.dataset) {
    closeFooterMenu(true);
  } else if (button.dataset.add) {
    const option = button.dataset.add;
    if (option === "limits") {
      content.querySelector("#limits-menu button").focus();
    } else if (option === "appearance" && separateAppearance) {
      content.querySelector("#appearance-submenu button").focus();
    } else {
      ui.added.add(option);
      ui.menu = "";
      const model = metadataTextFields[option]?.path;
      const focusTarget = { appearance: "[data-remove-appearance]", variable: "[data-toggle-name]" }[option];
      showSettings(model ? `[data-model="${model}"]` : focusTarget || `[data-remove-property="${option}"]`);
    }
  }
  updatePreview();
});

function setTextStyleMenu(trigger, open) {
  document.getElementById(trigger.getAttribute("aria-controls")).hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
  if (open && trigger.classList.contains("metadata-text-icon")) positionLabelPlacementMenu();
  if (open && trigger.closest(".footer-popup-anchor")) positionFooterPopup();
}

function positionFooterPopup() {
  const menu = content.querySelector(".footer-popup:not([hidden])");
  if (!menu) return;
  menu.style.removeProperty("--menu-shift");
  const bounds = menu.getBoundingClientRect();
  const shift = Math.min(Math.max(8 - bounds.left, 0), document.documentElement.clientWidth - bounds.right - 22);
  menu.style.setProperty("--menu-shift", shift + "px");
}

function positionLabelPlacementMenu() {
  const menu = content.querySelector(".label-placement-menu:not([hidden])");
  if (!menu) return;
  menu.style.removeProperty("--menu-shift");
  const bounds = menu.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const shift = Math.min(Math.max(8 - bounds.left, 0), viewportWidth - bounds.right - 22);
  menu.style.setProperty("--menu-shift", shift + "px");
}

function positionAddMenu() {
  const menu = content.querySelector("#add-menu");
  if (!menu) return;
  menu.style.removeProperty("--menu-shift");
  const viewportWidth = document.documentElement.clientWidth;
  const preferred = menu.getBoundingClientRect();
  const shift = Math.min(Math.max(8 - preferred.left, 0), viewportWidth - preferred.right - 8);
  menu.style.setProperty("--menu-shift", shift + "px");
  const bounds = menu.getBoundingClientRect();
  const space = 240;
  menu.dataset.submenuSide = viewportWidth - bounds.right >= space
    ? "right" : bounds.left >= space ? "left" : "below";
  if (menu.dataset.submenuSide === "below") {
    for (const row of menu.querySelectorAll(".limits-option")) {
      row.style.setProperty("--submenu-below-offset", `${bounds.bottom - row.getBoundingClientRect().top}px`);
    }
  }
}

window.addEventListener("resize", positionAddMenu);
window.addEventListener("resize", positionLabelPlacementMenu);
window.addEventListener("resize", positionFooterPopup);

function closeFooterMenu(restoreFocus) {
  ui.menu = "";
  showSettings(restoreFocus ? "[data-menu-toggle]" : undefined);
}

document.addEventListener("pointerdown", event => {
  const editorTrigger = content.querySelector(':is(.font-picker-trigger,.alignment-trigger,.metadata-text-icon,.footer-popup-anchor > button)[aria-expanded="true"]');
  if (editorTrigger && !editorTrigger.parentElement.contains(event.target)) setTextStyleMenu(editorTrigger, false);
  if (!ui.menu || event.target.closest(".add-menu-anchor")) return;
  ui.menu = "";
  content.querySelector(".add-menu")?.remove();
  const toggle = content.querySelector("[data-menu-toggle]");
  toggle?.setAttribute("aria-expanded", "false");
  toggle?.removeAttribute("aria-controls");
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && shadowDraft) {
    shadowDraft = null;
    showSettings("[data-open-shadow]");
    updatePreview();
    return;
  }
  if (event.key === "Escape") {
    const editorTrigger = content.querySelector(':is(.font-picker-trigger,.alignment-trigger,.metadata-text-icon,.footer-popup-anchor > button)[aria-expanded="true"]');
    if (editorTrigger) {
      setTextStyleMenu(editorTrigger, false);
      editorTrigger.focus();
    }
  }
  if (event.key === "Escape" && ui.menu) closeFooterMenu(true);
});

showSettings();
updatePreview();
