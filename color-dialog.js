"use strict";

const colorDialog = (() => {
  const channel = "text-widget-color-window";
  const frame = document.createElement("iframe");
  frame.className = "color-window-frame";
  frame.title = "Настройка цвета";
  frame.hidden = true;
  let ready = false;
  let nextSession = 0;
  let current = null;

  function send(type, session, data = {}) {
    frame.contentWindow.postMessage({ channel, type, session, ...data }, "*");
  }

  function openFrame() {
    const { session, trigger, title, value, palette } = current;
    send("open", session, { anchor: trigger.getBoundingClientRect().toJSON(), title, value, palette });
    frame.focus({ preventScroll: true });
  }

  function dismiss() {
    const previous = current;
    current = null;
    frame.hidden = true;
    previous?.trigger.focus({ preventScroll: true });
  }

  window.addEventListener("message", event => {
    const message = event.data;
    if (event.source !== frame.contentWindow || message?.channel !== channel) return;
    if (message.type === "ready") {
      ready = true;
      if (current) openFrame();
      return;
    }
    if (!current || current.session !== message.session) return;
    if (message.type === "close") dismiss();
    if (message.type === "confirm") {
      const { onConfirm } = current;
      dismiss();
      const value = message.value;
      if (/^#[a-f0-9]{6}$/i.test(value?.color) && Number.isInteger(value.alpha) && value.alpha >= 0 && value.alpha <= 100) {
        onConfirm(value);
      }
    }
  });
  frame.src = "color-window.html";
  document.body.append(frame);

  return {
    open(trigger, { title, value, palette, onConfirm }) {
      current = { session: ++nextSession, trigger, title, value, palette, onConfirm };
      frame.hidden = false;
      if (ready) openFrame();
    },
    close() {
      if (!current) return;
      if (ready) send("close", current.session);
      dismiss();
    },
  };
})();
