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

// 负责渲染React组件
class ReactCompositUnit extends Unit {
  getMarkUp(rootId) {
    this._rootId = rootId;
    let { type: Component, props } = this.currentElement;
    let componentInstance = new Component(props);

    // 组件实例化时，触发willMount
    componentInstance.componentWillMount &&
      componentInstance.componentWillMount();

    // 调用render后返回的结果
    let reactComponentRenderer = componentInstance.render();
    // 递归渲染 组件render后的返回结果
    let ReactCompositUnitInstance = createReactUnit(reactComponentRenderer);
    let markUp = ReactCompositUnitInstance.getMarkUp(rootId);

    // 递归结束触发mounted，先子后父
    $(document).on("mounted", () => {
      componentInstance.componentDidMount &&
        componentInstance.componentDidMount();
    });

    // 实现把render方法返回结果  作为字符串返回回去
    return markUp;
  }
}

function createReactUnit(element) {
  if (typeof element === "string" || typeof element === "number") {
    return new ReactTextUnit(element);
  }
  if (typeof element === "object" && typeof element.type === "string") {
    return new ReactNativeUnit(element);
  }
  if (typeof element === "object" && typeof element.type === "function") {
    return new ReactCompositUnit(element);
  }
}

export default createReactUnit;
