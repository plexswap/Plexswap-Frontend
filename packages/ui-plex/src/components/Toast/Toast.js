var _a;
import { __assign, __makeTemplateObject, __rest } from "tslib";
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useEffect, useRef } from "react";
import { CSSTransition } from "react-transition-group";
import styled from "styled-components";
import { Alert, alertVariants } from "../Alert";
import { types } from "./types";
var alertTypeMap = (_a = {},
    _a[types.INFO] = alertVariants.INFO,
    _a[types.SUCCESS] = alertVariants.SUCCESS,
    _a[types.DANGER] = alertVariants.DANGER,
    _a[types.WARNING] = alertVariants.WARNING,
    _a);
var StyledToast = styled.div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  right: 16px;\n  position: fixed;\n  max-width: calc(100% - 32px);\n  transition: all 250ms ease-in;\n  width: 100%;\n\n  ", " {\n    max-width: 400px;\n  }\n"], ["\n  right: 16px;\n  position: fixed;\n  max-width: calc(100% - 32px);\n  transition: all 250ms ease-in;\n  width: 100%;\n\n  ", " {\n    max-width: 400px;\n  }\n"])), function (_a) {
    var theme = _a.theme;
    return theme.mediaQueries.sm;
});
export var Toast = function (_a) {
    var toast = _a.toast, onRemove = _a.onRemove, style = _a.style, ttl = _a.ttl, props = __rest(_a, ["toast", "onRemove", "style", "ttl"]);
    var timer = useRef();
    var ref = useRef(null);
    var id = toast.id, title = toast.title, description = toast.description, type = toast.type;
    var handleRemove = useCallback(function () { return onRemove(id); }, [id, onRemove]);
    var handleMouseEnter = function () {
        clearTimeout(timer.current);
    };
    var handleMouseLeave = function () {
        if (timer.current) {
            clearTimeout(timer.current);
        }
        timer.current = window.setTimeout(function () {
            handleRemove();
        }, ttl);
    };
    useEffect(function () {
        if (timer.current) {
            clearTimeout(timer.current);
        }
        timer.current = window.setTimeout(function () {
            handleRemove();
        }, ttl);
        return function () {
            clearTimeout(timer.current);
        };
    }, [timer, ttl, handleRemove]);
    return (_jsx(CSSTransition, __assign({ nodeRef: ref, timeout: 250, style: style }, props, { children: _jsx(StyledToast, __assign({ ref: ref, onMouseEnter: handleMouseEnter, onMouseLeave: handleMouseLeave }, { children: _jsx(Alert, __assign({ title: title, variant: alertTypeMap[type], onClick: handleRemove }, { children: description })) })) })));
};
var templateObject_1;
