import $ from "jquery";
import createReactUnit from "./unit";
import createElement from "./element";
let React = {
  render,
  nextRootIndex: 0,
  createElement,
};
function render(element, container) {
  let createReactUnitInstance = createReactUnit(element);
  let markUp = createReactUnitInstance.getMarkUp(React.nextRootIndex);
  // let markUp = `<span data-reactid="${React.nextRootIndex}">${element}</span>`;
  $(container).html(markUp);
}
export default React;
