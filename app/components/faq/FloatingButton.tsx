"use client";

import Image from "next/image";

type FloatingButtonProps = {
  onClick: () => void;
};

export default function FloatingButton({
  onClick,
}: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed
        bottom-24
        md:bottom-6
        right-5
        z-[9999]
        flex
        flex-col
        items-center
        justify-center
        w-[82px]
        h-[110px]
        rounded-[28px]
        bg-white/95
        backdrop-blur
        shadow-[0_8px_30px_rgba(0,0,0,0.08)]
        border
        border-[#F1F1F1]
        transition-all
        active:scale-95
      "
    >
      {/* 캐릭터 */}
      <div className="relative w-[52px] h-[52px] mb-1">
        <Image
          src="/diki-character.png"
          alt="디키캠프"
          fill
          className="object-contain"
          priority
        />
      </div>

      {/* 텍스트 */}
      <span className="text-[13px] font-bold text-[#222] leading-tight">
        디키캠프
      </span>

      <span className="text-[11px] text-[#777] mt-[2px]">
        문의
      </span>
    </button>
  );
}