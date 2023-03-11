import { ELEMENT_TEXT } from "./constants";
import { scheduleRoot } from "./scheduler";
import { Update, UpdateQueue } from "./UpdateQueue";

function createElement(type, config, ...children) {
  delete config.__self;
  delete config.__source; // 表示这个元素是在哪行哪列哪个文件生成的
  return {
    type,
    props: {
      ...config, // 兼容处理，react元素返回自己，文本类型返回文本元素对象
      children: children.map((child) => {
        return typeof child === "object"
          ? child
          : { type: ELEMENT_TEXT, props: { text: child, children: [] } };
      }),
    },
  };
}

class Component {
  constructor(props) {
    this.props = props;
    // this.updateQueue = new UpdateQueue();
  }

  setState(payload) {
    // 可能是一个对象，也可能是一个函数
    let update = new Update(payload);
    // updateQueue 在源码中是放在此类组件对应的fiber节点的internalFiber属性上
    this.internalFiber.updateQueue.enqueueUpdate(update);
    // this.updateQueue.enqueueUpdate(update);
    scheduleRoot();
  }
}

Component.prototype.isReactComponent = {}; // 类组件

const React = {
  createElement,
  Component,
};

export default React;
