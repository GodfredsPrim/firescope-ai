import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "leaflet/dist/leaflet.css";
import '@fontsource-variable/geist';
import './workspace.css';
import './news-workspace.css';
import './student-workspace.css';
import './calibration.css';
import './user-guide.css';
import './assessment.css';
import './roi-dashboard.css';
import './atlas.css';
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
