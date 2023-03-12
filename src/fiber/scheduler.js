import {
  UPDATE,
  DELETION,
  ELEMENT_TEXT,
  PALCEMENT,
  TAG_HOST,
  TAG_ROOT,
  TAG_TEXT,
  TAG_CLASS,
  TAG_FUNCTION_COMPONENT,
} from "./constants";
import { Update, UpdateQueue } from "./UpdateQueue";
import { setProps } from "./utils";

let nextUnitOfWork = null; // 下一个工作单元
let workInProgressRoot = null; // RootFiber应用的根
let currentRoot = null; // 渲染成功之后当前根Root Fiber
let deletions = []; // 删除的节点并不放在effectList中
let workInProgressFiber = null; // 正在工作中的fiber
let hookIndex = 0; // hooks索引，可能会有多个hook函数

/**
 * 从根节点开始渲染和调度
 * 两个阶段
 * diff阶段 对比新旧的虚拟DOM，进行增量更新或创建，render阶段
 * commit阶段 进行DOM更新创建阶段，此阶段不能暂停，要一气呵成
 */
export function scheduleRoot(rootFiber) {
  // 双缓冲机制
  if (currentRoot && currentRoot.alternate) {
    // 第二次之后的渲染（or say 第二次...更新）
    workInProgressRoot = currentRoot.alternate; // 第一次渲染出来的那个fiber tree
    workInProgressRoot.alternate = currentRoot; // 让工作树（即将挂载的树）的alternate指向当前树（页面DOM对应的树）
    if (rootFiber) {
      workInProgressRoot.props = rootFiber.props; // 更新props
    }
  } else if (currentRoot) {
    // 说明至少已经渲染过一次了（第二次渲染 or say 第一次更新）
    if (rootFiber) {
      rootFiber.alternate = currentRoot;
      workInProgressRoot = rootFiber;
    } else {
      workInProgressRoot = {
        ...currentRoot,
        alternate: currentRoot,
      };
    }
  } else {
    // 第一次渲染
    workInProgressRoot = rootFiber;
  }
  // 清空一些没有用的引用
  workInProgressRoot.firstEffect =
    workInProgressRoot.lastEffect =
    workInProgressRoot.nextEffect =
      null;
  nextUnitOfWork = workInProgressRoot;
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
    // 根fiber
    updateHostRoot(currentFiber);
  } else if (currentFiber.tag === TAG_TEXT) {
    // 文本fiber
    updateHostText(currentFiber);
  } else if (currentFiber.tag === TAG_HOST) {
    // 原生DOM节点  stateNode => dom
    updateHost(currentFiber);
  } else if (currentFiber.tag === TAG_CLASS) {
    // 类组件 stateNode => 组件实例
    updateClassComponent(currentFiber);
  } else if (currentFiber.tag === TAG_FUNCTION_COMPONENT) {
    // 函数组件
    updateFunctionComponent(currentFiber);
  }
}

function updateFunctionComponent(currenFiber) {
  workInProgressFiber = currenFiber;
  hookIndex = 0;
  workInProgressFiber.hooks = [];
  const newChildren = [currenFiber.type(currenFiber.props)];
  reconcileChildren(currenFiber, newChildren);
}

function updateClassComponent(currentFiber) {
  if (!currentFiber.stateNode) {
    // 类组件的stateNode是组件实例 组件实例和fiber双向指向
    currentFiber.stateNode = new currentFiber.type(currentFiber.props);
    // 让组件实例的internalFiber属性指向当前fiber节点
    currentFiber.stateNode.internalFiber = currentFiber;
    currentFiber.updateQueue = new UpdateQueue();
  }
  // 给组件实例的state赋值
  currentFiber.stateNode.state = currentFiber.updateQueue.forceUpdate(
    currentFiber.stateNode.state
  );
  let newElement = currentFiber.stateNode.render();
  const newChildren = [newElement];
  reconcileChildren(currentFiber, newChildren);
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
  // 是DOM节点更新DOM
  if (stateNode && stateNode.setAttribute) {
    setProps(stateNode, oldProps, newProps);
  }
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
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
  if (oldFiber) {
    // 清空effect，否则指针可能会出问题
    oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null;
  }
  let prevSibling; // 上一个新的子fiber
  while (newChildIndex < newChildren.length || oldFiber) {
    let newChild = newChildren[newChildIndex];
    let newFiber; // 新Fiber
    const sameType = oldFiber && newChild && oldFiber.type === newChild.type;
    let tag;
    if (
      newChild &&
      typeof newChild.type === "function" &&
      newChild.type.prototype.isReactComponent
    ) {
      // 类组件
      tag = TAG_CLASS;
    } else if (
      newChild &&
      typeof newChild.type === "function" &&
      !newChild.type.prototype.isReactComponent
    ) {
      // 函数组件
      tag = TAG_FUNCTION_COMPONENT;
    } else if (newChild && newChild.type === ELEMENT_TEXT) {
      tag = TAG_TEXT;
    } else if (typeof newChild.type === "string") {
      tag = TAG_HOST;
    }
    if (sameType) {
      // 老fiber和新的虚拟DOM一样，可以复用老的DOM节点，更新即可
      if (oldFiber.alternate) {
        // 至少更新过一次了
        newFiber = oldFiber.alternate; // 上上次Fiber
        newFiber.props = newChild.props;
        newFiber.alternate = oldFiber;
        newFiber.effectTag = UPDATE;
        newFiber.updateQueue = oldFiber.updateQueue || new UpdateQueue();
        newFiber.nextEffect = null;
      }
      newFiber = {
        tag: oldFiber.tag,
        type: oldFiber.type,
        props: newChild.props,
        stateNode: oldFiber.stateNode, // div还没有创建DOM
        return: currentFiber,
        alternate: oldFiber, // 让新fiber的alternate指向来的fiber节点
        effectTag: UPDATE, // 副作用标识 render阶段会收集副作用 增加 删除 更新
        updateQueue: oldFiber.updateQueue || new UpdateQueue(),
        nextEffect: null, // effectList也是个单链表
        // effect list顺序和完成顺序是一样的，但是节点只放有副作用的fiber节点
      };
    } else {
      if (newChild) {
        // 新的虚拟DOM是不是null 如jsx里面写了{null}
        newFiber = {
          tag,
          type: newChild.type,
          props: newChild.props,
          stateNode: null, // div还没有创建DOM
          return: currentFiber,
          effectTag: PALCEMENT, // 副作用标识 render阶段会收集副作用 增加 删除 更新
          updateQueue: new UpdateQueue(),
          nextEffect: null, // effectList也是个单链表
          // effect list顺序和完成顺序是一样的，但是节点只放有副作用的fiber节点
        };
      }
      if (oldFiber) {
        oldFiber.effectTag = DELETION;
        deletions.push(oldFiber);
      }
    }
    if (oldFiber) {
      // 删掉老的
      oldFiber = oldFiber.sibling; // oldFiber指针往后移动一次
    }
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
  // 先删除节点
  deletions.forEach(commitWork);
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    // console.log(
    //   "currenFiber",
    //   currentFiber.type,
    //   currentFiber.props.id,
    //   currentFiber.props.text
    // );
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  deletions.length = 0; // 清空
  currentRoot = workInProgressRoot;
  workInProgressRoot = null;
}

function commitWork(currentFiber) {
  if (!currentFiber) {
    return;
  }
  let returnFiber = currentFiber.return; // 类组件特殊处理
  while (
    returnFiber.tag !== TAG_HOST &&
    returnFiber.tag !== TAG_ROOT &&
    returnFiber.tag !== TAG_TEXT
  ) {
    returnFiber = returnFiber.return;
  }
  let returnDOM = returnFiber.stateNode;
  if (currentFiber.effectTag === PALCEMENT) {
    // 新增节点
    let nextFiber = currentFiber;
    if (nextFiber.tag === TAG_CLASS) {
      return;
    }
    // 如果要挂载的节点不是DOM节点，比如是类组件，一直找第一个儿子，直到找到一个真实DOM节点或文本节点为止
    while (nextFiber.tag !== TAG_HOST && nextFiber.tag !== TAG_TEXT) {
      nextFiber = nextFiber.child;
    }
    returnDOM.appendChild(nextFiber.stateNode);
  } else if (currentFiber.effectTag === DELETION) {
    // 删除节点
    commitDeletion(currentFiber, returnDOM);
    return;
  } else if (currentFiber.effectTag === UPDATE) {
    // 更新
    if (currentFiber.type === ELEMENT_TEXT) {
      // 文本节点
      if (currentFiber.alternate.props.text !== currentFiber.props.text) {
        currentFiber.stateNode.textContent = currentFiber.props.text;
      } else {
        if (currentFiber.type === TAG_CLASS) {
          currentFiber.effectTag = null;
          return;
        }
        updateDOM(
          currentFiber.stateNode,
          currentFiber.alternate.props,
          currentFiber.props
        );
      }
    }
  }
  currentFiber.effectTag = null;
}

function commitDeletion(currenFiber, domReturn) {
  if (currenFiber.tag === TAG_HOST || currenFiber.tag === TAG_TEXT) {
    domReturn.removeChild(currenFiber.stateNode);
  } else {
    commitDeletion(currenFiber.child, domReturn);
  }
}

export function useReducer(reducer, initialValue) {
  let newHook =
    workInProgressFiber.alternate &&
    workInProgressFiber.alternate.hooks &&
    workInProgressFiber.alternate.hooks[hookIndex];
  if (newHook) {
    newHook.state = newHook.updateQueue.forceUpdate(newHook.state);
  } else {
    newHook = {
      state: initialValue,
      updateQueue: new UpdateQueue(),
    };
  }

  const dispatch = (action) => {
    let payload = reducer ? reducer(newHook.state, action) : action;
    newHook.updateQueue.enqueueUpdate(new Update(payload));
    scheduleRoot();
  };
  workInProgressFiber.hooks[hookIndex++] = newHook;
  return [newHook.state, dispatch];
}

export function useState(initialValue) {
  return useReducer(null, initialValue);
}

// react 告诉浏览器，我现在有任务请你在闲的时候执行
// 有一个优先级的概念，expirationTime
requestIdleCallback(workLoop, { timeout: 500 });
