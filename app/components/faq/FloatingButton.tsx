"use client";

import Image from "next/image";

interface FloatingButtonProps {
  onClick: () => void;
}

export default function FloatingButton({
  onClick,
}: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed
        bottom-6
        right-6
        z-50
        w-[72px]
        h-[72px]
        rounded-full
        bg-white
        shadow-xl
        border
        border-neutral-200
        flex
        flex-col
        items-center
        justify-center
        transition
        hover:scale-105
      "
    >
      <Image
        src="/diki-character.png"
        alt="디키캠프"
        width={36}
        height={36}
        className="object-contain"
      />

      <span className="text-[10px] font-semibold text-neutral-700 mt-1">
        문의
      </span>
    </button>
  );
}