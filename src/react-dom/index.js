let isFirstRender = false;

let HostRoot = "HostFiber"; // 标识RootFiber类型
let ClassComponent = "ClassComponent"; // 表示类组件类型
let HostComponent = "HostComponent"; // 表示原生dom类型
let HostText = "HostText"; // 表示文本类型
// let FunctionComponent = "FunctionComponent"; // 表示函数组件类型

let NoWork = "NoWork";
let Placement = "Placement"; // 插入
let Update = "Update"; // 更新
let Deletion = "Delete"; // 删除
let PlacementAndUpdate = "PlacementAndUpdate"; // 插入并更新，一般是 节点换位置了同时更新了

class FiberNode {
  constructor(tag, key, pendingProps) {
    this.tag = tag; // 当前fiber的类型
    this.key = key;
    this.type = null; // "div" || "h1" || 类组件
    this.stateNode = null; // 当前fiber的实例
    this.child = null; // 表示当前fiber的子节点 每个fiber有且只有一个属性指向它的first child
    this.sibling = null; // 表示当前节点的兄弟节点 每个fiber有且只有一个属性指向隔壁的兄弟节点
    this.return = null; // 当前节点的父节点
    this.index = 0; // 兄弟次序
    this.memoizedState = null; // 表示当前fiber的state
    this.memoizedProps = null; // 表示当前fiber的props
    this.pendingProps = pendingProps; // 表示新进来的props
    this.effectTag = null; // 表示当前节点要进行何种更新
    this.firstEffect = null; // 表示当前节点有更新的第一个子节点
    this.lastEffect = null; // 表示当前节点有更新的最后一个子节点
    this.nextEffect = null; // 表示当前节点下一个要更新的子节点
    this.alternate = null; // 用来连接current和workInProgress
    this.updateQueue = null; // 一条链表，挂载的是当前fiber新的状态
    // ...
    // expiredTime
  }
}

function createFiber(tag, key, pendingProps) {
  return new FiberNode(tag, key, pendingProps);
}

function createWorkInProgress(current, pendingProps) {
  // 复用current.alternate
  let workInProgress = current.alternate;
  if (!workInProgress) {
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    workInProgress.pendingProps = pendingProps;
    workInProgress.effectTag = NoWork;
    workInProgress.firstEffect = null;
    workInProgress.lastEffect = null;
    workInProgress.nextEffect = null;
  }

  // 要保证current和current.alternate上的updateQueue是同步的
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.child = current.child;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;

  return workInProgress;
}

class ReactRoot {
  constructor(container) {
    this._internalRoot = this._createRoot(container);
  }

  _createRoot(container) {
    let uninitialFiber = this._createUninitialFiber(HostRoot, null, null);
    let root = {
      container,
      current: uninitialFiber,
      finishedWork: null, // workInProgress树
    };
    uninitialFiber.stateNode = root;
    return root;
  }

  _createUninitialFiber(tag, key, pendingProps) {
    return createFiber(tag, key, pendingProps);
  }

  render(reactElement, callback) {
    let root = this._internalRoot;
    let workInProgress = createWorkInProgress(root.current);
  }
}

const ReactDOM = {
  render(reactElement, container, callback) {
    isFirstRender = true;
    let root = new ReactRoot(container);
    container._reactRootContainer = root;
    root.render(reactElement, callback);
  },
};

export default ReactDOM;
