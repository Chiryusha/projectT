import type { ButtonProps } from "../../types/button";

const Button = ({ children, className, type = "button", ...props }: ButtonProps) => {
  return (
    <button className={className} type={type} {...props}>
      {children}
    </button>
  );
};

export default Button;
