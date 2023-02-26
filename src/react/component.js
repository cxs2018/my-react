class Component {
  constructor(props) {
    this.props = props;
  }

  setState(partialState) {
    // update函数的第一个参数代表新的元素，第二个参数代表新的状态
    this._currentUnit.update(null, partialState);
  }
}

export default Component;
