let rootFiber = require("./element");
let nextUnitOfWork = null;

function workLoop() {
  while (nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  if (!nextUnitOfWork) {
    console.log("render阶段结束了");
  }
}

function performUnitOfWork(fiber) {
  beginWork(fiber);
  if (fiber.child) {
    return fiber.child;
  }
  while (fiber) {
    completeUnitOfWork(fiber);
    if (fiber.sibling) {
      return fiber.sibling;
    }
    fiber = fiber.return;
  }
}

function beginWork(fiber) {
  console.log("开始", fiber.key);
}

function completeUnitOfWork(fiber) {
  console.log("结束", fiber.key);
}

nextUnitOfWork = rootFiber;
workLoop();
