import { TAG_ROOT } from "./constants";

function render(element, container) {
  let rootFiber = {
    tag: TAG_ROOT,
    stateNode: container,
    props: {
      children: [element],
    },
  };
  scheduleRoot(rootFiber);
}

const ReactDOM = {
  render,
};

export default ReactDOM;
