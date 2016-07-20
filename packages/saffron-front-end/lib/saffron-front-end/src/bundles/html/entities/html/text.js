"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const index_1 = require('saffron-common/src/fragments/index');
const entity_1 = require('saffron-common/src/entities/entity');
class TextEntity extends entity_1.default {
    load({ section }) {
        return __awaiter(this, void 0, void 0, function* () {
            section.appendChild(this.node = document.createTextNode(this.expression.nodeValue));
        });
    }
    update() {
        this.node.nodeValue = this.expression.nodeValue;
    }
    willUnmount() {
        this.node.parentNode.removeChild(this.node);
    }
}
exports.fragment = new index_1.ClassFactoryFragment('entities/htmlText', TextEntity);
//# sourceMappingURL=text.js.map