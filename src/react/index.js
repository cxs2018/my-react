import $ from "jquery";
import createReactUnit from "./unit";
import createElement from "./element";
import Component from "./component";
let React = {
  render,
  nextRootIndex: 0,
  createElement,
  Component,
};
function render(element, container) {
  let createReactUnitInstance = createReactUnit(element);
  let markUp = createReactUnitInstance.getMarkUp(React.nextRootIndex);
  // let markUp = `<span data-reactid="${React.nextRootIndex}">${element}</span>`;
  $(container).html(markUp);

  // 触发挂载完成的钩子函数
  $(document).trigger("mounted");
}
export default React;
