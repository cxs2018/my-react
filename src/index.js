import React from "./fiber/react";

// class SubCounter extends React.Component {
//   componentWillMount() {
//     console.log("child will mount");
//   }

//   componentDidMount() {
//     console.log("child mounted");
//   }

//   render() {
//     return React.createElement(
//       "div",
//       { name: "div" },
//       "hello world" + this.props.name,
//       React.createElement("div", { name: "div2" }, "my-react")
//     );
//   }
// }

// class Counter extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       number: 0,
//     };
//   }

//   componentWillMount() {
//     console.log("parent will mount");
//   }

//   componentDidMount() {
//     console.log("parent mounted");
//     // setInterval(() => {
//     //   this.setState({
//     //     number: this.state.number + 1,
//     //   });
//     // }, 1000)
//   }

//   componentDidUpdate() {
//     console.log("parent update");
//   }

//   // shouldComponentUpdate(nextProps, nextState) {
//   //   return nextState.number % 2 === 0
//   // }

//   handleClick = () => {
//     this.setState({
//       number: this.state.number + 1,
//     });
//   };

//   render() {
//     let p = React.createElement("p", {}, this.state.number);
//     let button = React.createElement(
//       "button",
//       { onClick: this.handleClick },
//       "+"
//     );
//     return React.createElement(
//       "div",
//       {
//         style: {
//           color: this.state.number % 2 === 0 ? "red" : "green",
//           backgroundColor: this.state.number % 2 === 0 ? "white" : "#ccc",
//         },
//       },
//       p,
//       button
//     );
//   }
// }

// class Counter2 extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       odd: false,
//     };
//   }

//   componentDidMount() {
//     console.log("parent mounted");
//     setTimeout(() => {
//       this.setState({
//         odd: !this.state.odd,
//       });
//     }, 1000);
//   }

//   render() {
//     if (!this.state.odd) {
//       return React.createElement(
//         "ul",
//         null,
//         React.createElement("li", { key: "A" }, "A"),
//         React.createElement("li", { key: "B" }, "B"),
//         React.createElement("li", { key: "C" }, "C"),
//         React.createElement("li", { key: "D" }, "D")
//       );
//     } else {
//       return React.createElement(
//         "ul",
//         null,
//         React.createElement("span", { key: "A" }, "A1"),
//         React.createElement("li", { key: "C" }, "C1"),
//         React.createElement("li", { key: "B" }, "B1"),
//         React.createElement("li", { key: "E" }, "E1"),
//         React.createElement("li", { key: "F" }, "F1")
//       );
//     }
//   }
// }

// class ToDos extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       list: [],
//       text: "",
//     };
//   }

//   onChange = (event) => {
//     this.setState({
//       text: event.target.value,
//     });
//   };

//   handleClick = () => {
//     let text = this.state.text;
//     this.setState({
//       list: [...this.state.list, text],
//     });
//   };

//   onDel = (index) => {
//     this.setState({
//       list: [
//         ...this.state.list.slice(0, index),
//         ...this.state.list.slice(index + 1),
//       ],
//     });
//   };

//   render() {
//     let input = React.createElement("input", {
//       onKeyup: this.onChange,
//       value: this.state.text,
//     });
//     let button = React.createElement(
//       "button",
//       { onClick: this.handleClick },
//       "+"
//     );
//     let lists = this.state.list.map((item, index) => {
//       return React.createElement(
//         "div",
//         {},
//         item,
//         React.createElement("button", { onClick: () => this.onDel(index) }, "X")
//       );
//     });
//     return React.createElement(
//       "div",
//       {},
//       input,
//       button,
//       ...lists
//       // React.createElement("ul", {}, ...lists)
//     );
//   }
// }

function say() {
  alert(1);
}

// let element = React.createElement(
//   "div",
//   { name: "xxx" },
//   "hello",
//   React.createElement(
//     "div",
//     { name: "yyy" },
//     React.createElement("button", { onClick: say }, "alert")
//   )
// );

// let element = React.createElement(ToDos, { name: "cxs" });

// console.log(element);

// jsx -> React.createElement 通过 babel 编译
// <button id="sayhello" style={{color: 'red', backgroundColor: 'green'}} onClick={say}>sayhello</button>

// let element = React.createElement(
//   "button",
//   {
//     id: "sayhello",
//     style: { color: "red", backgroundColor: "green" },
//     onClick: say,
//   },
//   "sayhello"
// );

// React.createElement 返回值是一个对象，即虚拟DOM，用js对象模拟DOM节点，包含type、props、children等信息
// {
//   type: "button",
//   props: {
//     id: "sayhello",
//     style: { color: "red", backgroundColor: "green" },
//     onClick: say
//   },
//   children: ["sayhello"]
// }

// React 提供一个render函数，第一个参数是虚拟DOM，第二个参数挂载的真实DOM节点
// React.render(element, document.getElementById("root"));

// 读源码
// 1. 广度优先
// 2. 深度优先

// 文件目录有哪些、是干啥的
// 设置断点、调试、debugger
// 堆栈法：先写一个简单的例子，比如计数器，然后进行调试，看调用栈，每个流程跑一跑、看一看干啥的
// 珠峰 my-react 基于react 15.3 思路是一样的，简化了 先看0.3版本，简单

const element = (
  <div id="A1">
    <div id="B1">B1</div>
    <div id="B2">B2</div>
  </div>
);

console.log(element);
