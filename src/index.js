import React from "./react";

class SubCounter extends React.Component {
  componentWillMount() {
    console.log("child will mount");
  }

  componentDidMount() {
    console.log("child mounted");
  }

  render() {
    return React.createElement(
      "div",
      { name: "div" },
      "hello world" + this.props.name,
      React.createElement("div", { name: "div2" }, "my-react")
    );
  }
}

class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      number: 234,
    };
  }

  componentWillMount() {
    console.log("parent will mount");
  }

  componentDidMount() {
    console.log("parent mounted");
  }

  render() {
    return React.createElement(
      "div",
      { name: "divRoot" },
      this.state.number,
      React.createElement(SubCounter, { name: "subCounter" })
    );
  }
}

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
// console.log(element);

let element = React.createElement(Counter, { name: "cxs" });

React.render(element, document.getElementById("root"));
