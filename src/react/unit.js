import $ from "jquery";
class Unit {
  constructor(element) {
    this.currentElement = element;
  }
}
class ReactTextUnit extends Unit {
  getMarkUp(rootId) {
    this._rootId = rootId;
    return `<span data-reactid="${rootId}">${this.currentElement}</span>`;
  }
}
class ReactNativeUnit extends Unit {
  getMarkUp(rootId) {
    this._rootId = rootId;
    let { type, props } = this.currentElement;
    let tagStart = `<${type} data-reactid="${rootId}"`;
    let tagEnd = `</${type}>`;
    let contentStr;
    for (let propName in props) {
      if (/^on[A-Z]/.test(propName)) {
        let eventType = propName.slice(2).toLowerCase();
        $(document).on(
          eventType,
          `[data-reactid="${rootId}"]`,
          props[propName]
        );
      }
      if (propName === "children") {
        contentStr = props[propName]
          .map((child, idx) => {
            let childInstance = createReactUnit(child);
            return childInstance.getMarkUp(`${rootId}.${idx}`);
          })
          .join("");
      } else {
        tagStart += ` ${propName}=${props[propName]}`;
      }
    }
    return tagStart + ">" + contentStr + tagEnd;
  }
}
function createReactUnit(element) {
  if (typeof element === "string" || typeof element === "number") {
    return new ReactTextUnit(element);
  }
  if (typeof element === "object" && typeof element.type === "string") {
    return new ReactNativeUnit(element);
  }
}

export default createReactUnit;
