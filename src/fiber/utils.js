export function setProps(dom, oldProps, newProps) {
  for (let key in oldProps) {
    if (key !== "children") {
      if (newProps.hasOwnProperty(key)) {
        // 老的有新的有，覆盖
        setProp(dom, key, newProps[key]);
      } else {
        // 老的有新的没有，删除
        dom.removeAttribute(key);
      }
    }
  }
  for (let key in newProps) {
    if (key !== "children") {
      if (!oldProps.hasOwnProperty(key)) {
        // 新的有老的没有，新增
        setProp(dom, key, newProps[key]);
      }
    }
  }
}

function setProp(dom, key, value) {
  if (/^on/.test(key)) {
    dom[key.toLowerCase()] = value;
  } else if (key === "style") {
    if (value) {
      for (let styleName in value) {
        dom.style[styleName] = value[styleName];
      }
    }
  } else {
    dom.setAttribute(key, value);
  }
}
