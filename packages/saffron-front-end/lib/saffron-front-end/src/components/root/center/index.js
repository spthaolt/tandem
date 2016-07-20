"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
require('./index.scss');
const React = require('react');
const registered_1 = require('saffron-common/src/react/components/registered');
class CenterComponent extends React.Component {
    render() {
        var currentFile = this.props.app.currentFile;
        return (React.createElement("div", {className: 'm-editor-center'}, currentFile ? React.createElement(registered_1.default, __assign({ns: `components/stage/${currentFile.ext}`, file: currentFile}, this.props)) : void 0));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CenterComponent;
//# sourceMappingURL=index.js.map