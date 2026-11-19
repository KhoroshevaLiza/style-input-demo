"use strict";

const $ = selector => document.querySelector(selector);
const colors = [
  "#F6733C", "#313E78", "#12A12C", "#ECB956", "#DC2219", "#6757B7", "#000000", "#999999", "#2562AA", "#8991A9",
  "#FFF8F5", "#F5FAFF", "#F5FFF7", "#FFFCF5", "#FFF5F5", "#F7F5FF", "#FFFFFF",
];
const pickerHSV = { h: 51 };
const activeScreen = "palette";
const draft = { color: null, alpha: 100 };

function styleTexture(element) {
  element.hidden = true;
}

function placeMediaPopup(element, anchor, { left, top }) {
  const bounds = anchor.getBoundingClientRect();
  const width = element.offsetWidth * Math.min(1, (innerWidth - 16) / 366);
  const height = element.offsetHeight * Math.min(1, (innerWidth - 16) / 366);
  element.style.left = Math.max(8, Math.min(innerWidth - width - 8, bounds.left + left)) + "px";
  element.style.top = Math.max(8, Math.min(innerHeight - height - 8, bounds.top + top)) + "px";
}
