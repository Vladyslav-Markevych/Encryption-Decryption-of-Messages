import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// импорт registerSW из vite-plugin-pwa
import { registerSW } from "virtual:pwa-register";
import Snowfall from "react-snowfall";

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Доступна новая версия, обновить?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("Приложение готово к оффлайн-режиму");
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Snowfall color="white"/>
    <App />
  </React.StrictMode>
);
