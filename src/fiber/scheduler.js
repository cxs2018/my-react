import {
  ELEMENT_TEXT,
  PALCEMENT,
  TAG_HOST,
  TAG_ROOT,
  TAG_TEXT,
} from "./constants";

let nextUnitOfWork = null; // 下一个工作单元
let workInProgressRoot = null; // RootFiber应用的根

/**
 * 从根节点开始渲染和调度
 * 两个阶段
 * diff阶段 对比新旧的虚拟DOM，进行增量更新或创建，render阶段
 * commit阶段 进行DOM更新创建阶段，此阶段不能暂停，要一气呵成
 */
function scheduleRoot(rootFiber) {
  workInProgressRoot = rootFiber;
  nextUnitOfWork = rootFiber;
}

function performUnitOfWork(currentFiber) {
  beginWork(currentFiber);
}

/**
 *
 */
function beginWork(currentFiber) {
  if (currentFiber.tag === TAG_ROOT) {
    updateHostRoot(currentFiber);
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
  if (!nextUnitOfWork) {
    console.log("render阶段结束了");
  }
  // 不管有没有任务，都请求浏览器再次调度，每一帧都执行一次workLoop
  requestIdleCallback(workLoop, { timeout: 500 });
}

// react 告诉浏览器，我现在有任务请你在闲的时候执行
// 有一个优先级的概念，expirationTime
requestIdleCallback(workLoop, { timeout: 500 });
