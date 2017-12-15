// TODO - infinite loop detection

import { expect } from "chai";
import { InferenceType, loadModuleDependencyGraph, lintDependencyGraph, DiagnosticType } from "..";

describe(__filename + "#", () => {

  // deep inferencing
  [
    [
      {
        "entry": `
          <component id="test">
            <template>
              [[bind a]]
            </template>
          </component>
          <component id="test2">
            <template>
              <test />
            </template>
          </component>
        `
      },
      [
        {
          filePath: "entry",
          location: {
            start: {
              column: 15,
              line: 9,
              pos: 198
            },
            end: {
              column: 23,
              line: 9,
              pos: 206
            }
          },
          message: `Property "a" is undefined`,
          type: DiagnosticType.ERROR
        }
      ]
    ],
    [
      {
        "entry": `
          <component id="test">
            <template>
              [[bind a * c]]
            </template>
            <preview name="main">
              <test a="b" />
            </preview>
          </component>
        `
      },
      [
        {
          filePath: "entry",
          location: {
            start: {
              column: 23,
              line: 7,
              pos: 165
            },
            end: {
              column: 26,
              line: 7,
              pos: 168
            }
          },
          message: `Type mismatch: attribute "a" expecting a number, string provided.`,
          type: DiagnosticType.ERROR
        },
        {
          filePath: "entry",
          location: {
            start: {
              column: 15,
              line: 7,
              pos: 157
            },
            end: {
              column: 29,
              line: 7,
              pos: 171
            }
          },
          message: `Property "c" is undefined`,
          type: DiagnosticType.ERROR
        }
      ]
    ],
    [
      {
        "entry": `
          <component id="test">
            <template>
              [[bind a * c]]
            </template>
            <preview name="main">
              <test a=[[bind 1]] c=[[bind 2]] />
            </preview>
          </component>
        `
      },
      [],
    ],
    [
      {
        "entry": `
          <component id="test">
            <template>
              [[bind a.b.c * 4]]
            </template>
            <preview name="main">
              <test a=[[bind {a: {b: 1 }}]] />
            </preview>
          </component>
        `
      },
      [
        {
          filePath: "entry",
          location: {
            end: {
              column: 42,
              line: 7,
              pos: 188
            },
            start: {
              column: 30,
              line: 7,
              pos: 176
            }
          },
          message: `Property "a.b.c" is undefined`,
          type: "ERROR"
        },
      ]
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              [[bind c * 1]]
            </template>
          </component>
          <component id="b">
            <template>
              <a c=[[bind d]] />
            </template>
            <preview name="main">
              <b d="1" />
            </preview>
          </component>
        `
      },
      [
        {
          "type": "ERROR",
          "location": {
            "start": {
              "column": 20,
              "line": 12,
              "pos": 291
            },
            "end": {
              "column": 23,
              "line": 12,
              "pos": 294
            }
          },
          "message": "Type mismatch: attribute \"c\" expecting a number, string provided.",
          "filePath": "entry"
        }
      ]
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              [[bind c * 1]]
            </template>
          </component>
          <component id="b">
            <template>
              <a c=[[bind d]] />
            </template>
            <preview name="main">
              <b [[bind {d: 1}]] />
            </preview>
          </component>
        `
      },
      []
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              [[bind c * 1]]
            </template>
          </component>
          <component id="b">
            <template>
              <a c=[[bind d]] />
            </template>
            <preview name="main">
              <b [[bind {c: 1}]] />
            </preview>
          </component>
        `
      },
      [
        {
          "type": "ERROR",
          "location": {
            "start": {
              "column": 25,
              "line": 12,
              "pos": 296
            },
            "end": {
              "column": 31,
              "line": 12,
              "pos": 302
            }
          },
          "message": "Property \"d\" is undefined",
          "filePath": "entry"
        },
        {
          "type": "ERROR",
          "location": {
            "start": {
              "column": 25,
              "line": 12,
              "pos": 296
            },
            "end": {
              "column": 31,
              "line": 12,
              "pos": 302
            }
          },
          "message": "Property \"c\" is undefined",
          "filePath": "entry"
        }
      ]
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              <a />
            </template>
          </component>
        `
      },
      [
        {
          filePath: "entry",
          location: {
            start: {
              column: 15,
              line: 4,
              pos: 67
            },
            end: {
              column: 20,
              line: 4,
              pos: 72
            }
          },
          message: `Maximum callstack exceeded`,
          type: DiagnosticType.ERROR
        }
      ]
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              <a [[if a.a]] a=[[bind a.a]] />
            </template>
          </component>
        `
      },
      []
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              [[bind c]]
              <a [[if a.a]] a=[[bind a.a]] />
            </template>
            <preview name="main">
              <a a=[[bind { c: 1, a: { c: 1, a: null } }]] c="1" />
            </preview>
          </component>
        `
      },
      [
        {
          filePath: "entry",
          location: {
            start: {
              column: 15,
              line: 5,
              pos: 92
            },
            end: {
              column: 46,
              line: 5,
              pos: 123
            }
          },
          message: `Property "c" is undefined`,
          type: DiagnosticType.ERROR
        }
      ]
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              [[bind c]]
              <a [[if a.a]] a=[[bind a.a]] c=[[bind a.c]] />
            </template>
            <preview name="main">
              <a a=[[bind { c: 1, a: { c: 1, a: null } }]] c="1" />
            </preview>
          </component>
        `
      },
      []
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              <a [[repeat a as b]] [[bind b]]></a>
            </template>
            <preview name="main">
              <a a=[[bind []]] />
            </preview>
          </component>
        `
      },
      []
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              <a [[repeat a as b]] [[bind b]]></a>
            </template>
            <preview name="main">
              <a a=[[bind [ {} ]]] />
            </preview>
          </component>
        `
      },
      [
        {
          "type": "ERROR",
          "location": {
            "start": {
              "column": 29,
              "line": 7,
              "pos": 190
            },
            "end": {
              "column": 31,
              "line": 7,
              "pos": 192
            }
          },
          "message": "Property \"a\" is undefined",
          "filePath": "entry"
        }
      ]
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              <a [[repeat a as b]] a=[[bind b]]></a>
            </template>
            <preview name="main">
              <a a=[[bind [ {a: []} ]]] />
            </preview>
          </component>
        `
      },
      []
    ],
    [
      {
        "entry": `
          <component id="a">
            <template>
              <a [[repeat a as b]] [[bind b]]></a>
            </template>
            <preview name="main">
              <a a=[[bind [ {a: [{a:[]}]} ]]] />
            </preview>
          </component>
        `
      },
      []
    ],
    [
      {
        "entry": `
          <component id="c">
            <template>
              [[bind d]]
            </template>
          </component>
          <component id="b">
            <template>

            </template>
          </component>
          <component id="a">
            <template>
              <b>
                <c [[repeat i as k]] [[bind k]] />
              </b>
            </template>
            <preview name="main">
              <a i=[[bind [{}]]] />
            </preview>
          </component>
        `
      },
      [
        {
          "type": "ERROR",
          "location": {
            "start": {
              "column": 28,
              "line": 19,
              "pos": 450
            },
            "end": {
              "column": 30,
              "line": 19,
              "pos": 452
            }
          },
          "message": "Property \"d\" is undefined",
          "filePath": "entry"
        }
      ]
    ],

    // optional testing
    [
      {
        "entry": `
          <component id="c">
            <template>
              <a [[if a]]>[[bind a]]</a>
            </template>
            <preview name="main">
              <c />
            </preview>
          </component>          
        `
      },
      []
    ],
    [
      {
        "entry": `
          <component id="c">
            <template>
              [[bind a || "not defined"]]
            </template>
            <preview name="main">
              <c />
            </preview>
          </component>          
        `
      },
      []
    ],
    [
      {
        "entry": `
          <component id="c">
            <template>
              <a [[if a]]>[[bind a]]</a>
              [[bind a]]
            </template>
            <preview name="main">
              <c />
            </preview>
          </component>          
        `
      },
      [
        {
          filePath: "entry",
          location: {
            end: {
              column: 20,
              line: 8,
              pos: 196
            },
            start: {
              column: 15,
              line: 8,
              pos: 191
            }
          },
          message: `Property "a" is undefined`,
          type: DiagnosticType.ERROR
        }
      ]
    ]
  ].forEach(([sources, inferResult]: any) => {
    it(`can lint ${sources.entry}`, async () => {
      const { graph } = await loadModuleDependencyGraph("entry", {
        readFile: (uri) => sources[uri]
      });

      const result = lintDependencyGraph(graph);

      // uncomment to update locs
      // console.log(JSON.stringify(result.diagnostics, null, 2));
      expect(result.diagnostics).to.eql(inferResult);
    });
  });
});