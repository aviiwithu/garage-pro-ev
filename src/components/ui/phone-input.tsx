import * as React from "react"
import { Input } from "./input"
import { ControllerRenderProps } from "react-hook-form"

interface PhoneInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    field?: ControllerRenderProps<any, any>
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function PhoneInput({
    field,
    onChange,
    className,
    ...props
}: PhoneInputProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (field) {
            field.onChange(e)
        }
        onChange?.(e)
    }

    return (
        <div className="flex items-center">
            <div className="relative">
                <Input
                    type="text"
                    placeholder="98765 43210"
                    className={`pl-16 ${className || ""}`}
                    maxLength={10}
                    {...field}
                    {...props}
                    onChange={handleChange}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">🇮🇳 +91</span>
                </div>
            </div>
        </div>
    )
}