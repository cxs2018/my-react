import $ from "jquery";
import { Element } from "./element";
import Type from "./type";

let diffQueue = []; // 差异队列
let updateDepth = 0; // 更新的级别

class Unit {
  constructor(element) {
    this._currentElement = element;
  }
}
class ReactTextUnit extends Unit {
  update(nextElement) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement;
      $(`[data-reactid="${this._rootId}"]`).html(this._currentElement);
    }
  }

  getMarkUp(rootId) {
    this._rootId = rootId;
    return `<span data-reactid="${rootId}">${this._currentElement}</span>`;
  }
}
class ReactNativeUnit extends Unit {
  updateDOMProperties(oldProps, newProps) {
    let propName;
    // 循环老的属性集合
    for (propName in oldProps) {
      // 新的props没有这个属性
      if (!newProps.hasOwnProperty(propName)) {
        $(`[data-reactid="${this._rootId}"]`).removeAttr(propName);
        // 取消事件委托
        if (/^on[A-Z]/.test(propName)) {
          $(document).undelegate(`.${this._rootId}`);
        }
      }
    }
    for (propName in newProps) {
      if (propName === "children") {
        // 如果是儿子属性的话，先不处理
        continue;
      } else if (/^on[A-Z]/.test(propName)) {
        let eventType = propName.slice(2).toLowerCase();
        // 先取消之前的事件委托
        $(document).undelegate(`.${this._rootId}`);
        // 添加新的事件委托
        $(document).delegate(
          `[data-reactid="${this._rootId}"]`,
          `${eventType}.${this._rootId}`,
          newProps[propName]
        );
      } else if (propName === "style") {
        Object.entries(newProps[propName]).forEach(([attr, value]) => {
          $(`[data-reactid="${this._rootId}"]`).css(attr, value);
        });
      } else if (propName === "className") {
        // $(`[data-reactid=${this._rootId}]`)[0].className = newProps[propName];
        $(`[data-reactid="${this._rootId}"]`).attr("class", newProps[propName]);
      } else {
        $(`[data-reactid="${this._rootId}"]`).prop(
          propName,
          newProps[propName]
        );
      }
    }
  }

  // 此处要把新的儿子们传过来，然后和老的儿子们进行对比，找出差异，修改DOM
  updateDOMChildren(newChildrenElements) {
    updateDepth++;
    this.diff(diffQueue, newChildrenElements);
    console.log(diffQueue);
    updateDepth--;
    if (updateDepth === 0) {
      this.patch(diffQueue);
      diffQueue = [];
    }
  }

  patch(diffQueue) {
    let deleteChildren = []; // 要删除的节点
    let deleteMap = {}; // 暂存能复用的节点
    for (let i = 0; i < diffQueue.length; i++) {
      const difference = diffQueue[i];
      if (difference.type === Type.MOVE || difference.type === Type.REMOVE) {
        let fromIndex = difference.fromIndex;
        let oldChild = $(difference.parentNode.children().get(fromIndex));
        if (!deleteMap[difference.parentId]) {
          deleteMap[difference.parentId] = {};
        }
        deleteMap[difference.parentId][fromIndex] = oldChild;
        deleteChildren.push(oldChild);
      }
    }
    $.each(deleteChildren, (idx, item) => $(item).remove());
    for (let i = 0; i < diffQueue.length; i++) {
      const difference = diffQueue[i];
      switch (difference.type) {
        case Type.INSERT:
          this.insertChildAt(
            difference.parentNode,
            difference.toIndex,
            $(difference.markUp)
          );
          break;
        case Type.MOVE:
          this.insertChildAt(
            difference.parentNode,
            difference.toIndex,
            deleteMap[difference.parentId][difference.fromIndex]
          );
          break;
        default:
          break;
      }
    }
  }

  insertChildAt(parentNode, index, newNode) {
    let oldChild = parentNode.children().get(index);
    oldChild ? newNode.insertBefore(oldChild) : newNode.appendTo(parentNode);
  }

  diff(diffQueue, newChildrenElements) {
    // 第一步生成一个老儿子的map
    let oldChildrenUnitMap = this.getOldChildrenMap(
      this._renderedChildrenUnits
    );
    // 第二步生成一个新儿子的unit数组
    let { newChildrenUnits, newChildrenUnitMap } = this.getNewChildren(
      oldChildrenUnitMap,
      newChildrenElements
    );
    let lastIndex = 0; // 上一个已经确定位置的索引
    for (let i = 0; i < newChildrenUnits.length; i++) {
      let newUnit = newChildrenUnits[i];
      let newKey =
        (newUnit._currentElement.props && newUnit._currentElement.props.key) ||
        i.toString();
      let oldChildUnit = oldChildrenUnitMap[newKey];
      if (oldChildUnit === newUnit) {
        // 如果说新老一致的话，说明是复用老节点
        if (oldChildUnit._mountedIndex < lastIndex) {
          diffQueue.push({
            parentId: this._rootId,
            parentNode: $(`[data-reactid="${this._rootId}"]`),
            type: Type.MOVE,
            fromIndex: oldChildUnit._mountedIndex,
            toIndex: i,
          });
        }
        lastIndex = Math.max(lastIndex, oldChildUnit._mountedIndex);
      } else {
        // key一样，type不一样
        if (oldChildUnit) {
          diffQueue.push({
            parentId: this._rootId,
            parentNode: $(`[data-reactid="${this._rootId}"]`),
            type: Type.REMOVE,
            fromIndex: oldChildUnit._mountedIndex,
          });
          // 如果要删除掉某一个节点，要把它对应的unit也删除掉
          this._renderedChildrenUnits = this._renderedChildrenUnits.filter(
            (item) => item !== oldChildUnit
          );
          // 取消事件委托
          $(document).undelegate(`.${oldChildUnit._rootId}`);
        }
        diffQueue.push({
          parentId: this._rootId,
          parentNode: $(`[data-reactid="${this._rootId}"]`),
          type: Type.INSERT,
          toIndex: i,
          markUp: newUnit.getMarkUp(`${this._rootId}.${i}`),
        });
      }
      newUnit._mountedIndex = i;
    }
    for (let oldKey in oldChildrenUnitMap) {
      let oldChild = oldChildrenUnitMap[oldKey];
      if (!newChildrenUnitMap.hasOwnProperty(oldKey)) {
        diffQueue.push({
          parentId: this._rootId,
          parentNode: $(`[data-reactid="${this._rootId}"]`),
          type: Type.REMOVE,
          fromIndex: oldChild._mountedIndex,
        });
        // 如果要删除掉某一个节点，要把它对应的unit也删除掉
        this._renderedChildrenUnits = this._renderedChildrenUnits.filter(
          (item) => item !== oldChild
        );
        // 还有把这个节点对应的事件委托也删除掉
        $(document).undelegate(`.${oldChild._rootId}`);
      }
    }
  }

  // TODO: 为什么不直接使用 this._currentElement.props.children
  // DONE: 因为this._currentElement.props.children保存的是虚拟DOM，我们想要获得儿子的unit，不只是虚拟DOM
  getOldChildrenMap(childrenUnits = []) {
    let map = {};
    for (let i = 0; i < childrenUnits.length; i++) {
      let key =
        (childrenUnits[i] &&
          childrenUnits[i]._currentElement &&
          childrenUnits[i]._currentElement.props &&
          childrenUnits[i]._currentElement.props.key) ||
        i.toString();
      map[key] = childrenUnits[i];
    }
    return map;
  }

  getNewChildren(oldChildrenUnitMap, newChildrenElements) {
    let newChildren = [];
    let newChildrenUnitMap = {};
    newChildrenElements.forEach((newElement, index) => {
      let newKey =
        (newElement.props && newElement.props.key) || index.toString();
      let oldUnit = oldChildrenUnitMap[newKey]; // 找到老的unit
      let oldElement = oldUnit && oldUnit._currentElement; // 获取老元素
      if (shouldDeepCompare(oldElement, newElement)) {
        oldUnit.update(newElement);
        newChildren.push(oldUnit);
        newChildrenUnitMap[newKey] = oldUnit;
      } else {
        let newUnit = createReactUnit(newElement);
        newChildren.push(newUnit);
        newChildrenUnitMap[newKey] = newUnit;
        this._renderedChildrenUnits[index] = newUnit;
      }
    });
    return { newChildrenUnits: newChildren, newChildrenUnitMap };
  }

  update(nextElement) {
    let oldProps = this._currentElement.props;
    let newProps = nextElement.props;
    this.updateDOMProperties(oldProps, newProps);
    this.updateDOMChildren(nextElement.props.children);
  }

  getMarkUp(rootId) {
    this._rootId = rootId;
    let { type, props } = this._currentElement;
    let tagStart = `<${type} data-reactid="${rootId}"`;
    let tagEnd = `</${type}>`;
    let contentStr = "";
    this._renderedChildrenUnits = [];
    for (let propName in props) {
      if (/^on[A-Z]/.test(propName)) {
        let eventType = propName.slice(2).toLowerCase();
        // $(document).on(
        //   eventType,
        //   `[data-reactid="${rootId}"]`,
        //   props[propName]
        // );
        $(document).delegate(
          `[data-reactid="${rootId}"]`,
          `${eventType}.${rootId}`,
          props[propName]
        );
      } else if (propName === "style") {
        // 如果是一个样式对象
        let styles = Object.entries(props[propName])
          .map(([attr, value]) => {
            return `${attr.replace(
              /[A-Z]/g,
              (m) => `-${m.toLowerCase()}`
            )}:${value}`;
          })
          .join(";");
        tagStart += ` style="${styles}" `;
      } else if (propName === "className") {
        tagStart += ` class=${props[propName]} `;
      } else if (propName === "children") {
        contentStr = props[propName]
          .map((child, idx) => {
            let childInstance = createReactUnit(child);
            childInstance._mountedIndex = idx; // 每个unit有一个_mountedIndex属性，指向自己在父节点中的索引位置
            this._renderedChildrenUnits.push(childInstance);
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
  // 这里负责处理组件的更新操作
  update(nextElement, partialState) {
    // 先获取到新的元素
    this._currentElement = nextElement || this._currentElement;
    // 获取新的状态，不管要不要更新组件，组件的状态一定要修改
    let nextState = (this._componentInstance.state = Object.assign(
      this._componentInstance.state,
      partialState
    ));
    // 新的属性对象
    let nextProps = this._currentElement.props;
    if (
      this._componentInstance.shouldComponentUpdate &&
      !this._componentInstance.shouldComponentUpdate(nextProps, nextState)
    ) {
      return;
    }
    // 下面要进行比较更新，先得到上次渲染的单元
    let preRenderedUnitInstance = this._renderedUnitInstance;
    // 得到上次渲染的元素
    let preRenderedElement = preRenderedUnitInstance._currentElement;
    let nextRenderedElement = this._componentInstance.render();
    // 如果新旧两个元素类型一样，则可以进行深度比较，如果不一样，直接干掉老的元素，新建新的元素
    if (shouldDeepCompare(preRenderedElement, nextRenderedElement)) {
      // 如果可以进行深比较、则把更新的工作交给上次渲染出来的那个element元素对应的unit来处理
      preRenderedUnitInstance.update(nextRenderedElement);
      this._componentInstance.componentDidUpdate &&
        this._componentInstance.componentDidUpdate();
    } else {
      this._renderedUnitInstance = createReactUnit(nextRenderedElement);
      let nextMarkUp = this._renderedUnitInstance.getMarkUp(this._rootId);
      $(`[data-reactid="${this._rootId}"]`).replaceWith(nextMarkUp);
    }
  }

  getMarkUp(rootId) {
    this._rootId = rootId;
    let { type: Component, props } = this._currentElement;
    let componentInstance = (this._componentInstance = new Component(props));

    // 让组件实例的currentUnit属性等于当前的unit
    componentInstance._currentUnit = this;

    // 组件实例化时，触发willMount
    componentInstance.componentWillMount &&
      componentInstance.componentWillMount();

    // 调用render后返回的结果
    let reactComponentRenderer = componentInstance.render();
    // 递归渲染 组件render后的返回结果
    let ReactCompositUnitInstance = (this._renderedUnitInstance =
      createReactUnit(reactComponentRenderer));
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

// 判断两个元素的类型是否一样
function shouldDeepCompare(oldElement, newElement) {
  if (oldElement !== null && newElement !== null) {
    let oldType = typeof oldElement;
    let newType = typeof newElement;
    if (
      (oldType === "string" || oldType === "number") &&
      (newType === "string" || newType === "number")
    ) {
      return true;
    }
    if (oldElement instanceof Element && newElement instanceof Element) {
      return oldElement.type === newElement.type;
    }
  }
  return false;
}

export default createReactUnit;
