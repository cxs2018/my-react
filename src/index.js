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
      number: 0,
    };
  }

  componentWillMount() {
    console.log("parent will mount");
  }

  componentDidMount() {
    console.log("parent mounted");
  }

  componentDidUpdate() {
    console.log("parent update");
  }

  handleClick = () => {
    this.setState({
      number: this.state.number + 1,
    });
  };

  render() {
    let p = React.createElement("p", {}, this.state.number);
    let button = React.createElement(
      "button",
      { onClick: this.handleClick },
      "+"
    );
    return React.createElement(
      "div",
      {
        style: {
          color: this.state.number % 2 === 0 ? "red" : "green",
          backgroundColor: this.state.number % 2 === 0 ? "green" : "red",
        },
      },
      p,
      button
    );
  }
}

class Counter2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      odd: false,
    };
  }

  componentDidMount() {
    console.log("parent mounted");
    setInterval(() => {
      this.setState({
        odd: !this.state.odd,
      });
    }, 1000);
  }

  render() {
    if (!this.state.odd) {
      return React.createElement(
        "ul",
        null,
        React.createElement("li", { key: "A" }, "A"),
        React.createElement("li", { key: "B" }, "B"),
        React.createElement("li", { key: "C" }, "C"),
        React.createElement("li", { key: "D" }, "D")
      );
    } else {
      return React.createElement(
        "ul",
        null,
        React.createElement("li", { key: "A" }, "A"),
        React.createElement("li", { key: "C" }, "C1"),
        React.createElement("li", { key: "B" }, "B1"),
        React.createElement("li", { key: "E" }, "E1"),
        React.createElement("li", { key: "F" }, "F1")
      );
    }
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

// let element = React.createElement(
//   "button",
//   {
//     id: "sayhello",
//     style: { color: "red", backgroundColor: "green" },
//     onClick: say,
//   },
//   "sayhello"
// );

React.render(element, document.getElementById("root"));
