"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (startEvent, update, stop = undefined) => {
    const sx = startEvent.clientX;
    const sy = startEvent.clientY;
    const doc = startEvent.target.ownerDocument;
    function drag(event) {
        // stops text from getting highlighted
        event.preventDefault();
        update(event, {
            delta: {
                x: event.clientX - sx,
                y: event.clientY - sy,
            },
        });
    }
    function cleanup() {
        doc.removeEventListener('mousemove', drag);
        doc.removeEventListener('mouseup', cleanup);
        if (stop)
            stop();
    }
    doc.addEventListener('mousemove', drag);
    doc.addEventListener('mouseup', cleanup);
    return {
        dispose: cleanup,
    };
};
//# sourceMappingURL=start-drag.js.map