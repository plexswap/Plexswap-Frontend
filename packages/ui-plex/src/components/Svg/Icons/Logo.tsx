import React from "react";
import Svg from "../Svg";
import { SvgProps } from "../types";

const Icon: React.FC<React.PropsWithChildren<SvgProps>> = (props) => {
  return (
    <Svg viewBox="0 0 198 199" {...props}>
      <image
        width="520"
        height="520"
        href="data:image/png;base64,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"
        transform="matrix(0.24 0 0 0.24 37 38)"
      />
    </Svg>
  );
};

export default Icon;
