import React from "./react";

let element = React.createElement(
  "div",
  { name: "xxx" },
  "hello",
  React.createElement("span", { name: "yyy" }, "zzz")
);
console.log(element);
React.render(element, document.getElementById("root"));
