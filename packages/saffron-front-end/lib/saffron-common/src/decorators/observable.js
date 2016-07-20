"use strict";
const index_1 = require('../object/index');
const collection_1 = require('../object/collection');
const index_2 = require('../actions/index');
function observable(clazz) {
    var proto = clazz.prototype;
    if (proto instanceof index_1.default) {
        decorateObjectClass(clazz);
    }
    else if (proto instanceof collection_1.default) {
        decorateCollectionClass(clazz);
    }
    else {
        throw new Error(`class "${clazz.name}" cannot be made an observable. It must extend either a common Object or Collection.`);
    }
    if (clazz.__observable) {
        throw new Error(`class "${clazz.name}" is already observable.`);
    }
    clazz.__observable = true;
    return clazz;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = observable;
function decorateObjectClass(clazz) {
    const oldSetProperties = clazz.prototype.setProperties;
    clazz.prototype.setProperties = function (properties) {
        const changes = [];
        if (this.bus) {
            for (const key in properties) {
                const newValue = properties[key];
                const oldValue = this[key];
                // no change? skip.
                if (newValue == oldValue)
                    continue;
                if (newValue == void 0) {
                    changes.push({
                        target: this,
                        type: 'delete',
                        property: key,
                        oldValue: oldValue,
                    });
                }
                else if (newValue != void 0) {
                    if (oldValue == void 0) {
                        changes.push({
                            target: this,
                            type: 'create',
                            property: key,
                            value: newValue,
                        });
                    }
                    else {
                        changes.push({
                            target: this,
                            type: 'update',
                            property: key,
                            value: newValue,
                            oldValue: oldValue,
                        });
                    }
                }
            }
        }
        oldSetProperties.call(this, properties);
        if (changes && changes.length) {
            this.bus.execute(new index_2.ChangeAction(changes));
            if (this.didChange)
                this.didChange(changes);
        }
    };
    return clazz;
}
function decorateCollectionClass(clazz) {
    decorateObjectClass(clazz);
    const oldSplice = clazz.prototype.splice;
    clazz.prototype.splice = function (start, length, ...repl) {
        var oldValue = oldSplice.apply(this, arguments);
        if (this.bus) {
            const changes = [];
            changes.push({
                target: this,
                type: 'splice',
                value: repl,
                oldValue: oldValue
            });
            this.bus.execute(new index_2.ChangeAction(changes));
            if (this.didChange)
                this.didChange(changes);
        }
        return repl;
    };
    return clazz;
}
//# sourceMappingURL=observable.js.map