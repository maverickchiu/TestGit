'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = exports.template = exports.style = void 0;
exports.update = update;
exports.ready = ready;
exports.close = close;
const global_1 = require("./global");
let panel;
exports.style = ``;
exports.template = `
<div class="build-plugin">
    <ui-prop>
        <ui-label slot="label" value="Hide Link"></ui-label>
        <ui-checkbox slot="content"></ui-checkbox>
    </ui-prop>
    <ui-prop id="link">
        <ui-label slot="label" value="Docs"></ui-label>
        <ui-link slot="content" value=${Editor.Utils.Url.getDocUrl('editor/publish/custom-build-plugin.html')}></ui-link>
    </ui-prop>
</div>
`;
exports.$ = {
    root: '.build-plugin',
    hideLink: 'ui-checkbox',
    link: '#link',
};
/**
 * all change of options dispatched will enter here
 * @param options
 * @param key
 * @returns
 */
async function update(options, key) {
    if (key) {
        return;
    }
    // when import build options, key will bey ''
    init();
}
function ready(options) {
    // @ts-ignore
    panel = this;
    panel.options = options;
    init();
}
function close() {
    panel.$.hideLink.removeEventListener('change', onHideLinkChange);
}
function init() {
    panel.$.hideLink.value = panel.options.hideLink;
    updateLink();
    panel.$.hideLink.addEventListener('change', onHideLinkChange);
}
function onHideLinkChange(event) {
    panel.options.hideLink = event.target.value;
    // Note: dispatch the change to build panel
    panel.dispatch('update', `packages.${global_1.PACKAGE_NAME}.hideLink`, panel.options.hideLink);
    updateLink();
}
function updateLink() {
    if (panel.options.hideLink) {
        panel.$.link.style.display = 'none';
    }
    else {
        panel.$.link.style.display = 'block';
    }
}
