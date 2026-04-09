import React from 'react';
import { PhoneInput as BasePhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { cn } from '../../lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({ value, onChange, className, placeholder }) => {
  return (
    <div className={cn("phone-input-container", className)}>
      <BasePhoneInput
        defaultCountry="br"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full"
        inputClassName="!w-full !bg-white/5 !border-white/10 !rounded-none !text-white !h-10 !text-sm !font-sans focus-visible:!border-amber-500 focus-visible:!ring-0"
        countrySelectorStyleProps={{
          buttonClassName: "!bg-white/5 !border-white/10 !rounded-none !h-10",
          dropdownClassName: "!bg-[#111] !border-white/10 !text-white",
          flagClassName: "rounded-sm"
        }}
      />
      <style>{`
        .react-international-phone-input {
          flex: 1;
        }
        .react-international-phone-country-selector-button {
          padding: 0 8px;
        }
        .react-international-phone-country-selector-dropdown {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
        }
        .react-international-phone-country-selector-button__button-content {
          color: white;
        }
        .react-international-phone-country-selector-dropdown__list-item {
          padding: 8px 12px;
          color: #ccc;
        }
        .react-international-phone-country-selector-dropdown__list-item:hover {
          background-color: rgba(255, 255, 255, 0.05);
          color: white;
        }
        .react-international-phone-country-selector-dropdown__list-item--active {
          background-color: rgba(217, 119, 6, 0.1) !important;
          color: #d97706 !important;
        }
      `}</style>
    </div>
  );
};
