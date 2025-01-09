import React from "react";

const AiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    className="ai-icon"
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g filter="url(#filter0_di_20_128)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.3361 16.4112C14.5488 15.7731 15.4515 15.773 15.6642 16.4112L15.7096 16.5473C16.4561 18.7868 18.2135 20.5442 20.453 21.2907L20.5891 21.3361C21.2272 21.5488 21.2273 22.4515 20.5891 22.6642L20.453 22.7096C18.2135 23.4561 16.4561 25.2135 15.7096 27.453L15.6642 27.5891C15.4515 28.2272 14.5488 28.2272 14.3361 27.5891L14.2907 27.453C13.5442 25.2135 11.7869 23.4561 9.54732 22.7096L9.41126 22.6642C8.77308 22.4515 8.77306 21.5488 9.41126 21.3361L9.54731 21.2907C11.7869 20.5442 13.5442 18.7868 14.2907 16.5473L14.3361 16.4112Z"
        fill="white"
      />
      <path
        d="M21.0312 13.2674C21.1923 12.8321 21.808 12.8321 21.9691 13.2674L22.3657 14.3392C22.4163 14.4761 22.5242 14.584 22.6611 14.6346L23.7329 15.0312C24.1682 15.1923 24.1682 15.808 23.7329 15.9691L22.6611 16.3657C22.5242 16.4163 22.4163 16.5242 22.3657 16.6611L21.9691 17.7329C21.808 18.1682 21.1923 18.1682 21.0312 17.7329L20.6346 16.6611C20.584 16.5242 20.4761 16.4163 20.3392 16.3657L19.2674 15.9691C18.8321 15.808 18.8321 15.1923 19.2674 15.0312L20.3392 14.6346C20.4761 14.584 20.584 14.4761 20.6346 14.3392L21.0312 13.2674Z"
        fill="white"
      />
      <path
        d="M20.5312 26.2674C20.6923 25.8321 21.308 25.8321 21.4691 26.2674L21.7306 26.9743C21.7813 27.1111 21.8892 27.219 22.0261 27.2697L22.7329 27.5312C23.1682 27.6923 23.1682 28.308 22.7329 28.4691L22.0261 28.7306C21.8892 28.7813 21.7813 28.8892 21.7306 29.026L21.4691 29.7329C21.308 30.1682 20.6923 30.1682 20.5312 29.7329L20.2697 29.026C20.219 28.8892 20.1111 28.7813 19.9743 28.7306L19.2674 28.4691C18.8321 28.308 18.8321 27.6923 19.2674 27.5312L19.9743 27.2697C20.1111 27.219 20.219 27.1111 20.2697 26.9743L20.5312 26.2674Z"
        fill="white"
      />
    </g>
    <defs>
      <filter
        id="filter0_di_20_128"
        x="0.932617"
        y="0.940918"
        width="35.127"
        height="37.1187"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dx="2" dy="-2" />
        <feGaussianBlur stdDeviation="5" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.592157 0 0 0 0 0.278431 0 0 0 0 1 0 0 0 0.28 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_20_128"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect1_dropShadow_20_128"
          result="shape"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation="1.5" />
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0"
        />
        <feBlend
          mode="normal"
          in2="shape"
          result="effect2_innerShadow_20_128"
        />
      </filter>
    </defs>
  </svg>
);

export default AiIcon;
