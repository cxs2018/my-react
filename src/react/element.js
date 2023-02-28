export class Element {
  constructor(type, props) {
    this.type = type;
    this.props = props;
  }
}
/**
 * 创建Element，主要是把children放到props上，返回值用Element包裹，方便后续判断类型，instanceof Element
 * @param {*} type 
 * @param {*} props 
 * @param  {...any} children 
 * @returns 
 */
function createElement(type, props, ...children) {
  props = props || {};
  props.children = children;
  return new Element(type, props);
}
export default createElement;
