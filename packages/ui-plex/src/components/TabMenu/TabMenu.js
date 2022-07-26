import { __assign, __makeTemplateObject } from "tslib";
import { jsx as _jsx } from "react/jsx-runtime";
import { cloneElement, Children } from "react";
import styled from "styled-components";
import Flex from "../Box/Flex";
var Wrapper = styled(Flex)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  border-bottom: 2px solid ", ";\n  overflow-x: scroll;\n\n  ::-webkit-scrollbar {\n    display: none;\n  }\n  -ms-overflow-style: none; /* IE and Edge */\n  scrollbar-width: none; /* Firefox */\n"], ["\n  border-bottom: 2px solid ", ";\n  overflow-x: scroll;\n\n  ::-webkit-scrollbar {\n    display: none;\n  }\n  -ms-overflow-style: none; /* IE and Edge */\n  scrollbar-width: none; /* Firefox */\n"])), function (_a) {
    var theme = _a.theme;
    return theme.colors.input;
});
var Inner = styled(Flex)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n  justify-content: space-between;\n  flex-grow: 1;\n\n  & > button + button {\n    margin-left: 4px;\n  }\n\n  ", " {\n    flex-grow: 0;\n  }\n"], ["\n  justify-content: space-between;\n  flex-grow: 1;\n\n  & > button + button {\n    margin-left: 4px;\n  }\n\n  ", " {\n    flex-grow: 0;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaQueries.md;
});
var ButtonMenu = function (_a) {
    var _b = _a.activeIndex, activeIndex = _b === void 0 ? 0 : _b, onItemClick = _a.onItemClick, children = _a.children;
    return (_jsx(Wrapper, __assign({ p: ["0 4px", "0 16px"] }, { children: _jsx(Inner, { children: Children.map(children, function (child, index) {
                var isActive = activeIndex === index;
                return cloneElement(child, {
                    isActive: isActive,
                    onClick: onItemClick ? function () { return onItemClick(index); } : undefined,
                    color: isActive ? "backgroundAlt" : "textSubtle",
                    backgroundColor: isActive ? "textSubtle" : "input"
                });
            }) }) })));
};
export default ButtonMenu;
var templateObject_1, templateObject_2;
