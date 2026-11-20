"use strict";

const states = [
  ["rest", "В покое"],
  ["hover", "При наведении"],
  ["active", "Активный"],
];
const views = { main: "Текст", field: "Поле", label: "Метка", size: "Размер" };
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

function fieldStyle(state) {
  return {
    radius: 0,
    radiusMode: "unified",
    cornerRadii: [0, 0, 0, 0],
    borders: [0, 0, 1, 0],
    borderMode: "sides",
    borderWidth: 1,
    borderLine: "solid",
    borderAlpha: 100,
    background: null,
    backgroundAlpha: 100,
    textPreset: null,
    shadow: null,
    align: "left",
    borderColor: defaultBorderColor(state),
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
    label: { text: "", placement: "left", gap: 8, ...typography("#8991a9") },
    placeholder: "",
    limitLength: "",
    limitPattern: "",
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
  ["hint", "Подсказка", 20, 15],
  ["limits", "Ограничения", 18, 18],
  ["label", "Метка", 20, 9],
  ["multiline", "Многострочное", 20, 15],
];
const optionalTextFields = {
  hint: { path: "placeholder", title: "Подсказка", label: "Подсказка", caption: "подсказка", remove: "Убрать подсказку" },
  label: { path: "label.text", title: "Метка", label: "Текст метки", caption: "метка", remove: "Убрать метку" },
};
const content = document.querySelector("#settings-content");
const layout = document.querySelector(".widget-layout");
const preview = document.querySelector("#widget-preview");
const previewFrame = document.querySelector(".widget-frame");
const previewLabel = document.querySelector("#preview-label");
const previewText = document.querySelector("#preview-text");

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

function footerIcon([id, , width, height]) {
  return `<img src="assets/footer-${id}.svg" width="${width}" height="${height}" alt="">`;
}

function availableFooterOptions() {
  return footerOptions.filter(([id]) =>
    (id !== "hint" || canShowHint()) && (!optionalTextFields[id] || !ui.added.has(id)));
}

function canShowHint() {
  return widget.label.placement !== "small-above";
}

const labelPlacements = [
  ["left", "Текстом слева", 9],
  ["above", "Текстом сверху", 12],
  ["small-above", "Малая метка сверху", 10],
];

function labelPlacementPicker() {
  const selected = widget.label.placement;
  const icon = (placement, height) =>
    `<img src="assets/label-${placement}.svg" width="20" height="${height}" alt="">`;
  const [, title, height] = labelPlacements.find(([placement]) => placement === selected);
  return `<span class="label-placement">
    <button class="metadata-text-icon" type="button" data-text-styles data-placement="${selected}"
      aria-label="Расположение метки" title="${title}" aria-expanded="false"
      aria-controls="label-placement-menu">${icon(selected, height)}</button>
    <span class="text-style-menu label-placement-menu" id="label-placement-menu" role="group" aria-label="Расположение метки" hidden>
      <span class="text-style-options">
        ${labelPlacements.map(([placement, title, height]) => `<button class="add-menu-item label-placement-option" type="button"
          data-label-placement="${placement}" aria-pressed="${placement === selected}">
          <span class="menu-icon">${icon(placement, height)}</span><span>${title}</span>
        </button>`).join("")}
      </span>
      <button class="text-style-close" type="button" data-close-text-styles aria-label="Закрыть меню расположения метки"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </span>
  </span>`;
}

function optionalTextRow(id) {
  const { path, title, label, caption, remove } = optionalTextFields[id];
  return `<div class="metadata-text-row">
    <span class="metadata-text-control${id === "label" ? " with-icon" : ""}"${id === "label" ? ` style="--label-text-color:${colorFill(widget.label.color, widget.label.colorAlpha ?? 100)}"` : ""}>
      ${textInput(path, label, title)}
      <span class="metadata-text-caption" aria-hidden="true">${caption}</span>
      ${id === "label" ? labelPlacementPicker() : ""}
    </span>
    <button class="border-reset metadata-text-reset" type="button" data-remove-text="${id}" aria-label="${remove}"><img src="assets/border-reset.svg" width="9" height="9" alt=""></button>
  </div>`;
}

function footerMenu() {
  return `<div class="add-menu" id="add-menu" role="group" aria-labelledby="add-menu-title">
    <div class="add-menu-header">
      <span id="add-menu-title">Добавить</span>
      <button class="add-menu-close" type="button" data-menu-close aria-label="Закрыть меню"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </div>
    <div class="add-menu-items">${[...availableFooterOptions(), ["required", "Заполнять обязательно"]].map(([id, name, width, height]) => {
      const hasSubmenu = id === "limits";
      const item = `<button class="add-menu-item" type="button" data-add="${id}"${hasSubmenu ? ' aria-controls="limits-menu"' : ""}>
        <span class="menu-icon" aria-hidden="true">${width ? footerIcon([id, name, width, height]) : id === "required" ? "∗" : ""}</span>
        <span>${name}</span>${hasSubmenu ? '<img class="menu-chevron" src="assets/footer-chevron.svg" width="7" height="12" alt="">' : ""}
      </button>`;
      return hasSubmenu ? `<div class="limits-option">${item}
        <div class="limits-menu" id="limits-menu" role="group" aria-label="Ограничения">
          <div class="limits-menu-panel">
            <button class="add-menu-item" type="button" data-add="length">Количество символов</button>
            <button class="add-menu-item" type="button" data-add="pattern">Вводимые символы</button>
          </div>
        </div>
      </div>` : item;
    }).join("")}</div>
  </div>`;
}

function textStylePicker(id, path) {
  const menuId = `${id}-style-menu`;
  const selected = modelAt(path).textPreset || "main";
  const options = Object.entries(textStylePresets).map(([key, preset]) => {
    const active = key === selected;
    const attributes = `class="text-style-option${active ? " selected" : ""}" style="font-size:${preset.fontSize}px;font-weight:${preset.fontWeight};font-style:${preset.italic ? "italic" : "normal"}"`;
    return `<span role="listitem"><button type="button" ${attributes} data-text-preset="${key}" aria-pressed="${active}">${preset.title}</button></span>`;
  }).join("");
  return `<span class="text-style-anchor" data-text-style-path="${path}">
    <button class="link text-style-link" type="button" data-text-styles aria-expanded="false" aria-controls="${menuId}">${textStylePresets[selected].title}</button>
    <span class="text-style-menu" id="${menuId}" role="group" aria-label="Стили текста" hidden>
      <span class="text-style-options" role="list">
        ${options}
        <span class="text-style-option" role="listitem">Свой стиль</span>
      </span>
      <button class="text-style-close" type="button" data-close-text-styles aria-label="Закрыть список стилей"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </span>
  </span>`;
}

const fieldPresets = { transparent: "Прозрачное", filled: "Залитое" };

function fieldPresetPicker() {
  const { color, colorAlpha = 100 } = widget.styles.rest;
  return `<span class="style-picker-shell" data-field-preset="${widget.preset}" style="color:${colorFill(color, colorAlpha)}">
    <button class="style-picker" type="button" data-text-styles aria-expanded="false" aria-controls="field-preset-menu">${fieldPresets[widget.preset]}</button>
    <span class="field-preset-menu" id="field-preset-menu" role="group" aria-label="Стиль поля" hidden>
      ${Object.entries(fieldPresets).map(([id, title]) => `
        <button class="field-preset-option" type="button" data-preset="${id}" aria-pressed="${id === widget.preset}"><span>${title}</span></button>
      `).join("")}
      <button class="text-style-close" type="button" data-close-text-styles aria-label="Закрыть меню стиля"><img src="assets/close.svg" width="12" height="12" alt=""></button>
    </span>
  </span>`;
}

const sizeStepButtons = `
  <button class="step" type="button" data-step="-4" aria-label="Уменьшить высоту"><img src="assets/size-minus.svg" width="13" height="2" alt=""></button>
  <button class="step" type="button" data-step="4" aria-label="Увеличить высоту"><img src="assets/size-plus.svg" width="13" height="13" alt=""></button>
`;
document.querySelector(".header-size").innerHTML = sizeStepButtons;

function mainView() {
  return `<div class="card metadata">
    ${ui.added.has("label") ? optionalTextRow("label") : ""}
    <button class="name-row field-name" type="button" data-toggle-name aria-pressed="${Boolean(widget.name)}">
      <span>${widget.name || "Имя поля"}</span>
      ${widget.name ? '<span class="name-caption">имя</span>' : ""}
      <span class="name-icon" aria-hidden="true">&#xea90;</span>
    </button>
    ${canShowHint() && ui.added.has("hint") ? optionalTextRow("hint") : ""}
  </div>
  ${["required", "multiline", "length", "pattern"].some(id => ui.added.has(id)) ? `<div class="card added-options">
    ${ui.added.has("required") ? '<div class="row">Заполнять обязательно</div>' : ""}
    ${ui.added.has("multiline") ? '<div class="row">Многострочное</div>' : ""}
    ${ui.added.has("length") ? textInput("limitLength", "Количество символов", "Количество символов") : ""}
    ${ui.added.has("pattern") ? textInput("limitPattern", "Вводимые символы", "Вводимые символы") : ""}
  </div>` : ""}
  <div class="card appearance">
    ${row("Стиль", fieldPresetPicker() + arrow("field"))}
    ${row("Шрифт", textStylePicker("font", "styles.rest") + textColorButton("styles.rest"))}
    ${row("Размер", `<div class="size-steps">${sizeStepButtons}</div>` + arrow("size"))}
    ${row("Метка", textStylePicker("label", "label") + textColorButton("label") + arrow("label"))}
  </div>
  <div class="commands">
    ${availableFooterOptions().map(option => optionalTextFields[option[0]]
      ? `<button class="command" type="button" data-add="${option[0]}" aria-label="${option[1]}">${footerIcon(option)}</button>`
      : `<span class="command" aria-hidden="true">${footerIcon(option)}</span>`).join("")}
    <div class="add-menu-anchor">
      <button class="command" type="button" data-menu-toggle aria-label="Добавить" aria-expanded="${Boolean(ui.menu)}"${ui.menu ? ' aria-controls="add-menu"' : ""}>${footerIcon(["more", "", 18, 5])}</button>
      ${ui.menu ? footerMenu() : ""}
    </div>
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
  if (!text || placement === "left") return 0;
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
  positionLimitsMenu();
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
  preview.style.borderRadius = style.radiusMode === "corners"
    ? style.cornerRadii.map(radius => radius + "px").join(" ")
    : style.radius + "px";
  preview.style.borderStyle = style.borderLine;
  preview.style.borderColor = colorFill(style.borderColor, style.borderAlpha);
  preview.style.borderWidth = !style.borderColor ? "0px" : style.borderMode === "sides"
    ? style.borders.map(width => width + "px").join(" ") : style.borderWidth + "px";
  preview.style.background = colorFill(style.background, style.backgroundAlpha);
  const shadow = ui.view === "field" && shadowDraft ? shadowDraft : style.shadow;
  preview.style.boxShadow = shadow
    ? `${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${colorFill(shadow.color, shadow.alpha)}`
    : "none";
  preview.dataset.state = state;
  preview.setAttribute("aria-label", widget.name || "Предпросмотр текстового поля");
  const floatingLabel = label.placement === "small-above";
  previewFrame.dataset.placement = label.placement;
  const labelContainer = labelHeight ? previewFrame : previewText.parentElement;
  if (previewLabel.parentElement !== labelContainer) labelContainer.prepend(previewLabel);
  previewLabel.textContent = label.text;
  previewLabel.hidden = !label.text;
  const defaultPlaceholder = widgetTypes[widget.type].placeholder;
  const placeholder = (canShowHint() && widget.placeholder) || defaultPlaceholder;
  previewText.placeholder = floatingLabel && label.text ? label.text : placeholder;
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

function applyPreset(preset) {
  const filled = preset === "filled";
  for (const [state, style] of Object.entries(widget.styles)) {
    style.background = filled ? "#FFFFFF" : null;
    style.backgroundAlpha = 100;
    style.borders = [0, 0, filled ? 0 : 1, 0];
    style.borderWidth = filled ? 0 : 1;
    style.borderColor = filled ? null : defaultBorderColor(state);
    style.borderAlpha = 100;
    style.borderLine = "solid";
    style.borderMode = "sides";
  }
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
  }
  updatePreview();
}

const stage = document.querySelector(".settings-stage");
stage.addEventListener("input", updateModel);
stage.addEventListener("change", updateModel);
stage.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (!button) return;
  const { view, state, format, step } = button.dataset;
  if ("resetWidget" in button.dataset) {
    colorDialog.close();
    shadowDraft = null;
    widget = createWidget(widget.type);
    previewText.value = "";
    Object.assign(ui, { view: "main", state: "rest", menu: "" });
    ui.added.clear();
    showSettings();
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
  } else if (button.dataset.removeText) {
    const id = button.dataset.removeText;
    ui.added.delete(id);
    setModel(optionalTextFields[id].path, "");
    if (id === "label") widget.label.placement = "left";
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
    const trigger = content.querySelector(`[aria-controls="${button.parentElement.id}"]`);
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
    const { fontSize, fontWeight, italic } = textStylePresets[key];
    const picker = button.closest("[data-text-style-path]");
    const style = modelAt(picker.dataset.textStylePath);
    const menuId = picker.querySelector("[data-text-styles]").getAttribute("aria-controls");
    Object.assign(style, typography(style.color), { textPreset: key, fontSize, fontWeight, italic });
    showSettings(`[aria-controls="${menuId}"]`);
  } else if (button.dataset.preset) {
    if (widget.preset !== button.dataset.preset) {
      widget.preset = button.dataset.preset;
      applyPreset(widget.preset);
    }
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
    } else {
      ui.added.add(option);
      ui.menu = "";
      const model = optionalTextFields[option]?.path || { length: "limitLength", pattern: "limitPattern" }[option];
      showSettings(model ? `[data-model="${model}"]` : "[data-menu-toggle]");
    }
  }
  updatePreview();
});

function setTextStyleMenu(trigger, open) {
  document.getElementById(trigger.getAttribute("aria-controls")).hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
  if (open && trigger.classList.contains("metadata-text-icon")) positionLabelPlacementMenu();
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

function positionLimitsMenu() {
  const menu = content.querySelector("#add-menu");
  if (!menu) return;
  const bounds = menu.getBoundingClientRect();
  const space = 248;
  menu.dataset.submenuSide = document.documentElement.clientWidth - bounds.right >= space
    ? "right" : bounds.left >= space ? "left" : "below";
}

window.addEventListener("resize", positionLimitsMenu);
window.addEventListener("resize", positionLabelPlacementMenu);

function closeFooterMenu(restoreFocus) {
  ui.menu = "";
  showSettings(restoreFocus ? "[data-menu-toggle]" : undefined);
}

document.addEventListener("pointerdown", event => {
  const editorTrigger = content.querySelector(':is(.font-picker-trigger,.alignment-trigger,.metadata-text-icon)[aria-expanded="true"]');
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
    const editorTrigger = content.querySelector(':is(.font-picker-trigger,.alignment-trigger,.metadata-text-icon)[aria-expanded="true"]');
    if (editorTrigger) {
      setTextStyleMenu(editorTrigger, false);
      editorTrigger.focus();
    }
  }
  if (event.key === "Escape" && ui.menu) closeFooterMenu(true);
});

showSettings();
updatePreview();
