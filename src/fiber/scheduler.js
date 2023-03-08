import {
  ELEMENT_TEXT,
  PALCEMENT,
  TAG_HOST,
  TAG_ROOT,
  TAG_TEXT,
} from "./constants";
import { setProps } from "./utils";

let nextUnitOfWork = null; // 下一个工作单元
let workInProgressRoot = null; // RootFiber应用的根

/**
 * 从根节点开始渲染和调度
 * 两个阶段
 * diff阶段 对比新旧的虚拟DOM，进行增量更新或创建，render阶段
 * commit阶段 进行DOM更新创建阶段，此阶段不能暂停，要一气呵成
 */
export function scheduleRoot(rootFiber) {
  workInProgressRoot = rootFiber;
  nextUnitOfWork = rootFiber;
}

function performUnitOfWork(currentFiber) {
  beginWork(currentFiber);
  if (currentFiber.child) {
    return currentFiber.child;
  }
  while (currentFiber) {
    completeUnitOfWork(currentFiber);
    if (currentFiber.sibling) {
      return currentFiber.sibling;
    }
    currentFiber = currentFiber.return;
  }
}

// 在完成的时候收集有副作用的fiber，组成effect list
function completeUnitOfWork(currentFiber) {
  let returnFiber = currentFiber.return;
  if (returnFiber) {
    // 把自己儿子的effect链挂到父亲身上
    // currentFiber = B1
    // 看下父亲有没有first，没有的话，让自己的first作为父亲的first
    if (!returnFiber.firstEffect) {
      returnFiber.firstEffect = currentFiber.firstEffect;
    }
    // 看下自己有没有last，有的话，判断下父亲有没有last，父亲有last，把父亲last的next指向自己的first，就能把自己的first和自己的兄弟连起来，同时把父亲的last更新为自己的last
    // 因为下面第一个if的逻辑会先经过自己的孩子，孩子在最下面的effectTag逻辑会给父亲加上last，所以当父亲进来的时候，就会有last了，没有last的情况是为了跳过自己的儿子，儿子不走这个逻辑
    if (!!currentFiber.lastEffect) {
      if (!!returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber.firstEffect;
      }
      returnFiber.lastEffect = currentFiber.lastEffect;
    }
    // 把自己的effect链挂到父亲身上
    const effectTag = currentFiber.effectTag;
    if (effectTag) {
      // 每个fiber有两个属性，firstEffect指向第一个有副作用的子fiber，lastEffect指向最后一个有副作用的子fiber
      // 看下父节点的last有没有，有的话，让last的next指向当前节点，没有的话，让first指向当前节点，最后都让last指向当前节点
      // last没有，说明之前没有指过，先指一下first
      if (returnFiber.lastEffect) {
        returnFiber.lastEffect.nextEffect = currentFiber;
      } else {
        returnFiber.firstEffect = currentFiber;
      }
      returnFiber.lastEffect = currentFiber;
    }
  }
}

/**
 *
 */
function beginWork(currentFiber) {
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber);
  } else if (currentFiber.tag === TAG_TEXT) {
    updateHostText(currentFiber);
  } else if (currentFiber.tag === TAG_HOST) {
    updateHost(currentFiber);
  }
}

function updateHost(currentFiber) {
  if (!currentFiber.stateNode) {
    // 如果此fiber没有创建DOM节点
    currentFiber.stateNode = createDOM(currentFiber);
  }
  const newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}

function createDOM(currentFiber) {
  if (currentFiber.tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.props.text);
  } else if (currentFiber.tag === TAG_HOST) {
    let stateNode = document.createElement(currentFiber.type);
    updateDOM(stateNode, {}, currentFiber.props);
    return stateNode;
  }
}

function updateDOM(stateNode, oldProps, newProps) {
  setProps(stateNode, oldProps, newProps);
}

function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    // 如果此fiber没有创建DOM节点
    currentFiber.stateNode = createDOM(currentFiber);
  }
}

function updateHostRoot(currentFiber) {
  let newChildren = currentFiber.props.children;
  reconcileChildren(currentFiber, newChildren);
}

function reconcileChildren(currentFiber, newChildren) {
  let newChildIndex = 0; // 新子节点的索引
  let prevSibling; // 上一个新的子fiber
  while (newChildIndex < newChildren.length) {
    let newChild = newChildren[newChildIndex];
    let tag;
    if (newChild.type === ELEMENT_TEXT) {
      tag = TAG_TEXT;
    } else if (typeof newChild.type === "string") {
      tag = TAG_HOST;
    }
    let newFiber = {
      tag,
      type: newChild.type,
      props: newChild.props,
      stateNode: null, // div还没有创建DOM
      return: currentFiber,
      effectTag: PALCEMENT, // 副作用标识 render阶段会收集副作用 增加 删除 更新
      nextEffect: null, // effectList也是个单链表
      // effect list顺序和完成顺序是一样的，但是节点只放有副作用的fiber节点
    };
    if (newFiber) {
      if (newChildIndex === 0) {
        currentFiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
    }
    newChildIndex++;
  }
}

/**
 * 循环执行工作 nextUnitWork
 */
function workLoop(deadline) {
  let shouldYield = false; // 是否要让出时间片/控制权
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork); // 执行完一个任务之后
    shouldYield = deadline.timeRemaining() < 1; // 没有时间了
  }
  if (!nextUnitOfWork && workInProgressRoot) {
    console.log("render阶段结束了", workInProgressRoot);
    commitRoot();
  }
  // 不管有没有任务，都请求浏览器再次调度，每一帧都执行一次workLoop
  requestIdleCallback(workLoop, { timeout: 500 });
}

function commitRoot() {
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    console.log(
      "currenFiber",
      currentFiber.type,
      currentFiber.props.id,
      currentFiber.props.text
    );
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  workInProgressRoot = null;
}

function commitWork(currentFiber) {
  if (!currentFiber) {
    return;
  }
  let returnFiber = currentFiber.return;
  let returnDOM = returnFiber.stateNode;
  if (currentFiber.effectTag === PALCEMENT) {
    returnDOM.appendChild(currentFiber.stateNode);
  }
  currentFiber.effectTag = null;
}

// react 告诉浏览器，我现在有任务请你在闲的时候执行
// 有一个优先级的概念，expirationTime
requestIdleCallback(workLoop, { timeout: 500 });
