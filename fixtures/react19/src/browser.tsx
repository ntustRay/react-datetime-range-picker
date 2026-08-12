import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { FilterControl } from "./main.js";

const root = document.querySelector("#root");

if (root === null) {
  throw new Error("The Vite consumer root element is missing.");
}

createRoot(root).render(
  <StrictMode>
    <FilterControl />
  </StrictMode>,
);
