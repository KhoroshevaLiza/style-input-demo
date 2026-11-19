"use strict";

const channel = "text-widget-color-window";
let session = null;
const reply = (type, data = {}) => parent.postMessage({ channel, type, session, ...data }, "*");

function resizeColorWindow() {
  document.documentElement.style.setProperty("--dialog-scale", Math.min(1, (innerWidth - 16) / 366));
  positionColorDialog();
}

window.addEventListener("message", event => {
  const message = event.data;
  if (event.source !== parent || message?.channel !== channel) return;
  if (message.type === "close") {
    if (message.session === session) closeColorDialog();
    return;
  }
  if (message.type !== "open") return;
  closeColorFormatMenu();
  if (!mediaColorDialog.hidden) closeColorDialog();
  session = message.session;
  const current = session;
  const anchor = $("#color-anchor");
  Object.assign(anchor.style, {
    left: message.anchor.left + "px",
    top: message.anchor.top + "px",
    width: message.anchor.width + "px",
    height: message.anchor.height + "px",
  });
  resizeColorWindow();
  openColorDialog({
    value: message.value.color ? message.value : { color: "#000000", alpha: 100 },
    anchor,
    title: message.title,
    palette: message.palette || colors,
    onClose: () => queueMicrotask(() => {
      if (session === current) {
        reply("close");
        session = null;
      }
    }),
    onConfirm: value => {
      reply("confirm", { value });
      session = null;
    },
  });
});

document.addEventListener("pointerdown", event => {
  if (!mediaColorDialog.hidden && !event.target.closest("#media-color-dialog, #color-tooltip, #color-format-menu")) {
    closeColorDialog();
  }
});
document.addEventListener("keydown", event => {
  if (event.key !== "Escape" || mediaColorDialog.hidden) return;
  if (!colorFormatMenu.hidden) closeColorFormatMenu();
  else if (!$("#mine-menu").hidden) $("#mine-menu").hidden = true;
  else closeColorDialog();
});
window.addEventListener("resize", resizeColorWindow);
reply("ready");
