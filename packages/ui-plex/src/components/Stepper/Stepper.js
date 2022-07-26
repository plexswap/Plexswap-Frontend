import { __makeTemplateObject } from "tslib";
import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
import styled from "styled-components";
var StepperWrapper = styled.div(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  display: flex;\n  flex-direction: column;\n  width: fit-content;\n"], ["\n  display: flex;\n  flex-direction: column;\n  width: fit-content;\n"])));
var Stepper = function (_a) {
    var children = _a.children;
    var numberOfSteps = React.Children.count(children);
    return (_jsx(StepperWrapper, { children: React.Children.map(children, function (child) {
            if (React.isValidElement(child)) {
                return React.cloneElement(child, { numberOfSteps: numberOfSteps });
            }
            return child;
        }) }));
};
export default Stepper;
var templateObject_1;
