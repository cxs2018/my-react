import React from "./react";

function say() {
  alert(1);
}

let element = React.createElement(
  "div",
  { name: "xxx" },
  "hello",
  React.createElement(
    "div",
    { name: "yyy" },
    React.createElement("button", { onClick: say }, "alert")
  )
);
console.log(element);
React.render(element, document.getElementById("root"));
