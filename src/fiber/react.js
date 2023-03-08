import { ELEMENT_TEXT } from "./constants";

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

const React = {
  createElement,
};

export default React;
