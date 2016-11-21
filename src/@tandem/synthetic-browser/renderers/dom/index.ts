import { Action } from "@tandem/common";
import { decode } from "ent";
import { camelCase } from "lodash";
import { BaseRenderer } from "../base";
import { CallbackDispatcher } from "@tandem/mesh";
import { HTML_VOID_ELEMENTS, HTML_XMLNS, SVG_XMLNS, SVG_TAG_NAMES } from "@tandem/synthetic-browser/dom";

import {
  bindable,
  isMaster,
  diffArray,
  flattenTree,
  BoundingRect,
  traverseTree,
  TreeNodeEvent,
  watchProperty,
  calculateAbsoluteBounds
} from "@tandem/common";

import {
  DOMNodeType,
  SyntheticDOMNode,
  SyntheticDOMText,
  SyntheticDocument,
  SyntheticDOMElement,
  SyntheticCSSCharset,
  SyntheticCSSObject,
  syntheticCSSRuleType,
  SyntheticCSSStyleRule,
  SyntheticDOMContainer,
  AttachableSyntheticDOMNode,
  SyntheticCSSStyleDeclaration,
} from "../../dom";

import {
  DOMNodeEvent,
  AttributeChangeEvent,
  ValueNodeChangeEvent,
  CSSDeclarationValueChangeEvent,
} from "../../messages";

type HTMLElementDictionaryType = {
  [IDentifier: string]: [Element, SyntheticDOMNode]
}


type CSSRuleDictionaryType = {
  [IDentifier: string]: [CSSRule, syntheticCSSRuleType]
}

export class SyntheticDOMRenderer extends BaseRenderer {

  private _currentCSSText: string;
  private _firstRender: boolean;
  private _documentElement: HTMLElement;
  private _elementDictionary: HTMLElementDictionaryType;
  private _cssRuleDictionary: CSSRuleDictionaryType;
  private _nativeStyleSheet: CSSStyleSheet;

  createElement() {
    const element = document.createElement("div");
    element.innerHTML = this.getElementInnerHTML();
    return element;
  }

  protected onDocumentMutationEvent(event: Action) {
    super.onDocumentMutationEvent(event);

    // DOM
    if (event.type === ValueNodeChangeEvent.VALUE_NODE_CHANGE) {
      const [native, synthetic] = this.getElementDictItem(event.target);
      if (native) native.textContent = decode((<ValueNodeChangeEvent>event).newValue);
    } else if (event.type === AttributeChangeEvent.ATTRIBUTE_CHANGE) {
      const { name, value } = <AttributeChangeEvent>event;
      const [native, synthetic] = this.getElementDictItem(event.target);
      if (native) native.setAttribute(name, value);
    } else if (event.type === TreeNodeEvent.NODE_ADDED) {
      const [native, synthetic] = this.getElementDictItem(event.target.parent);
      if (native) {
        const childNode = renderHTMLNode(event.target, this._elementDictionary);
        if (childNode) native.appendChild(childNode);
      }
    } else if (event.type === TreeNodeEvent.NODE_REMOVED) {
      const [native, synthetic] = this.getElementDictItem(event.target);
      if (native && native.parentNode) native.parentNode.removeChild(native);
      this._elementDictionary[event.target.uid] = undefined;

    // CSS
    } else if (event.type === CSSDeclarationValueChangeEvent.CSS_DECLARATION_VALUE_CHANGE) {
      const { item, name, newValue, oldName } = <CSSDeclarationValueChangeEvent>event;
      const [native, synthetic] = this.getCSSDictItem(item.$parentRule);
      if (native) {
        console.log(native, name, newValue, item.$parentRule, (<CSSStyleRule>native).style[name]);
        //  (<CSSStyleRule>native).
        (<CSSStyleRule>native).style[name] = newValue;
        if (oldName) {
          (<CSSStyleRule>native).style[name] = undefined;
        }
      }
    }
  }

  protected getElementDictItem(synthetic: SyntheticDOMNode) {
    return this._elementDictionary[synthetic.uid] || [undefined, undefined];
  }

  protected getElementInnerHTML() {
    return `<style type="text/css"></style><div></div>`;
  }

  render() {
    const { document, element } = this;

    if (!this._documentElement) {
      this._documentElement = renderHTMLNode(document, this._elementDictionary = {});
      element.lastChild.appendChild(this._documentElement);
      this.styleElement.textContent = this._currentCSSText = document.styleSheets.map((styleSheet) => styleSheet.cssText).join("\n");
    }


    this.updateRects();
  }

  get styleElement() {
    return this.element.firstChild as HTMLStyleElement;
  }

  private getCSSDictItem(target: SyntheticCSSObject): [CSSRule, syntheticCSSRuleType] {
    if (!this._cssRuleDictionary) {
      this.registerStyleSheet();
    }
    return this._cssRuleDictionary[target.uid] || [undefined, undefined];
  }

  private registerStyleSheet() {
    this._cssRuleDictionary = {};

    const nativeStyleSheet = this._nativeStyleSheet = Array.prototype.slice.call(this.styleElement.ownerDocument.styleSheets).find((styleSheet: CSSStyleSheet) => {
      return styleSheet.ownerNode === this.styleElement;
    });

    if (!nativeStyleSheet) {
      console.warn(`Cannot find native style sheet generated by DOM renderer.`);
      return;
    }

    let h = 0;

    for (let i = 0, n  = this.document.styleSheets.length; i < n; i++){
      const styleSheet = this.document.styleSheets[i];
      for (let j = 0, n2 = styleSheet.rules.length; j < n2; j++) {
        const rule = styleSheet.rules[j];

        // TODO - need to remove charset from synthetic object

        if (rule instanceof SyntheticCSSCharset) continue;
        this._cssRuleDictionary[rule.uid] = [nativeStyleSheet.rules[h++], rule];
      }
    }

    console.log(this._cssRuleDictionary);
  }

  protected reset() {
    this._documentElement = undefined;
    this._nativeStyleSheet = undefined;
    this.element.innerHTML = this.getElementInnerHTML();
  }

  private updateRects() {
    const syntheticDOMNodesByUID = {};
    const rects  = {};
    const styles = {};

    for (let uid in this._elementDictionary) {
      const [native, synthetic] = this._elementDictionary[uid] || [undefined, undefined];

      // (<HTMLElement>native).

      const syntheticNode: SyntheticDOMNode = <SyntheticDOMNode>synthetic;
      if (syntheticNode && syntheticNode.nodeType === DOMNodeType.ELEMENT) {
        const rect = rects[uid]  = BoundingRect.fromClientRect(native.getBoundingClientRect());
        const nativeStyle = window.getComputedStyle(native);

        // just attach whatever's returned by the DOM -- don't wrap this in a synthetic, or else
        // there'll be massive performance penalties.
        styles[uid] = nativeStyle;
        (<AttachableSyntheticDOMNode<any>>syntheticNode).attachNative(native);
      }
    }

    this.setRects(rects, styles);
  }
}

function renderHTMLNode(syntheticNode: SyntheticDOMNode, dict: HTMLElementDictionaryType): any {
  switch(syntheticNode.nodeType) {

    case DOMNodeType.TEXT:

      const textElement = renderHTMLElement("span", syntheticNode, dict);
      textElement.appendChild(document.createTextNode(decode(syntheticNode.textContent)));
      return textElement;

    case DOMNodeType.ELEMENT:
      const syntheticElement = <SyntheticDOMElement>syntheticNode;
      if (/^(style|link)$/.test(syntheticElement.nodeName)) return null;
      const element = renderHTMLElement(syntheticElement.tagName, syntheticElement, dict);
      for (let i = 0, n = syntheticElement.attributes.length; i < n; i++) {
        const syntheticAttribute = syntheticElement.attributes[i];
        element.setAttribute(syntheticAttribute.name, syntheticAttribute.value);
      }
      return appendChildNodes(element, syntheticElement.childNodes, dict);
    case DOMNodeType.DOCUMENT:
    case DOMNodeType.DOCUMENT_FRAGMENT:
      const syntheticContainer = <SyntheticDOMContainer>syntheticNode;
      const containerElement = renderHTMLElement("span", syntheticContainer, dict);
      return appendChildNodes(containerElement, syntheticContainer.childNodes, dict);
  }
}

function renderHTMLElement(tagName: string, source: SyntheticDOMNode, dict: HTMLElementDictionaryType): any {
  const element = document.createElementNS(source.namespaceURI === SVG_XMLNS ? SVG_XMLNS : HTML_XMLNS, tagName);
  dict[source.uid] = [element, source];
  return element;
}

function appendChildNodes(container: HTMLElement|DocumentFragment, syntheticChildNodes: SyntheticDOMNode[], dict: HTMLElementDictionaryType) {
  for (let i = 0, n = syntheticChildNodes.length; i < n; i++) {
    const childNode = renderHTMLNode(syntheticChildNodes[i], dict);

    // ignored
    if (childNode == null) continue;
    container.appendChild(childNode);
  }
  return container;
}