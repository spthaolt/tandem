import "./index.scss";

import * as React from "react";
import { Editor } from "@tandem/editor/models";
import * as AutosizeInput from "react-input-autosize";
import { RegisteredComponent, FocusComponent } from "@tandem/editor/components/common";
import { FooterComponentFactoryDependency } from "@tandem/editor/dependencies";
import { SetZoomAction } from "@tandem/editor/actions";
import { FrontEndApplication } from "@tandem/editor/application";

class ZoomLabelComponent extends React.Component<{ editor: Editor, app: FrontEndApplication }, { editZoom: number }> {
  constructor() {
    super();
    this.state = { editZoom: null };
  }

  editZoom = () => {
    this.setState({ editZoom: this.props.editor.transform.scale * 100 });
  }

  onFocus = (event: React.FocusEvent) => {
    (event.target as any).select();
  }

  doneEditing = () => {
    this.setState({ editZoom: undefined });
  }

  onInputChange = (event: React.KeyboardEvent) => {
    const value = Number((event.target as any).value || 0);
    this.setState({ editZoom: value });
    this.props.app.bus.execute(new SetZoomAction(value ? value / 100 : value));
  }

  onKeyDown = (event: React.KeyboardEvent) => {
    if (event.keyCode === 13) {
      this.setState({ editZoom: undefined });
    }
  }

  render() {
    const { scale } = this.props.editor.transform;
    return <span>{ this.state.editZoom != null ? this.renderEditZoom(scale) : <span onClick={this.editZoom}>{Math.round((scale || 0) * 100)}</span> }%</span>;
  }

  renderEditZoom(scale: number) {
    return <FocusComponent><AutosizeInput
      type="text"
      className="footer-zoom-input"
      onFocus={this.onFocus}
      value={this.state.editZoom}
      onChange={this.onInputChange}
      onBlur={this.doneEditing}
      onKeyDown={this.onKeyDown}
      /></FocusComponent>
  }
}

class FooterComponent extends React.Component<{ editor: Editor, app: FrontEndApplication }, any> {
  render() {
    const { scale } = this.props.editor.transform;
    return (<div className="m-preview-footer">
      <ZoomLabelComponent {...this.props} />
      <RegisteredComponent {...this.props} ns={FooterComponentFactoryDependency.getNamespace("**")} />
    </div>);
  }
}

export default FooterComponent;
