"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface FAQItem {
  id: string;
  대분류: string;
  질문: string;
  답변: string;
}

export default function FaqWidget() {
  // FAQ 데이터
  const [faqData, setFaqData] = useState<FAQItem[]>([]);

  // 열린 질문
  const [openId, setOpenId] = useState<string | null>(null);

  // 선택 카테고리
  const [selectedCategory, setSelectedCategory] =
    useState<string>("전체");

  // FAQ 열림 상태
  const [isOpen, setIsOpen] = useState(false);

  // FAQ API 불러오기
  useEffect(() => {
    fetch(
      "https://script.google.com/macros/s/AKfycbz8uvpt1Rw7wq0YQ7DkPYBp8zZskfDr4qmdsOTobiklA9Y4qzQv_tV3oN7nzBqR5cqF/exec"
    )
      .then((res) => res.json())
      .then((data) => {
        setFaqData(data.faq);
      })
      .catch((error) => {
        console.error("FAQ 불러오기 실패:", error);
      });
  }, []);

  // 질문 열기/닫기
  const toggleAnswer = (id: string) => {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
    }
  };

  // 카테고리 목록
  const categories = [
    "전체",
    ...new Set(faqData.map((item) => item.대분류)),
  ];

  // 카테고리 필터
  const filteredFaq =
    selectedCategory === "전체"
      ? faqData
      : faqData.filter(
          (item) => item.대분류 === selectedCategory
        );

  return (
    <>
      {/* 플로팅 버튼 */}
      <div
        className="
          fixed
          bottom-6
          right-6
          z-[99999]
        "
      >
        <button
          onClick={() => setIsOpen(true)}
          className="
            bg-white
            rounded-[28px]
            shadow-2xl
            border border-gray-200

            w-[110px]
            py-4 px-3

            flex
            flex-col
            items-center
            justify-center

            hover:scale-105
            transition

            cursor-pointer
          "
        >
          {/* 캐릭터 이미지 */}
          <Image
            src="/diki-character.png"
            alt="디키 캐릭터"
            width={55}
            height={55}
            className="object-contain mb-2"
          />

          {/* 텍스트 */}
          <div className="text-center leading-tight">
            <div className="text-sm font-bold">
              디키캠프
            </div>

            <div className="text-sm">
              문의
            </div>
          </div>
        </button>
      </div>

      {/* FAQ 패널 */}
      {isOpen && (
        <>
          {/* 배경 */}
          <div
            onClick={() => setIsOpen(false)}
            className="
              fixed
              inset-0
              bg-black/40
              z-40
            "
          />

          {/* Bottom Sheet */}
          <div
            className="
              fixed
              bottom-0
              left-0
              right-0
              z-50

              bg-[#FFFDF6]

              rounded-t-[32px]

              h-[85vh]

              shadow-2xl

              flex
              flex-col
            "
          >
            {/* 상단 핸들 */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-14 h-1.5 rounded-full bg-gray-300" />
            </div>

            {/* 헤더 */}
            <div
              className="
                px-5
                pb-4
                flex
                items-center
                justify-between
              "
            >
              {/* 왼쪽 영역 */}
              <div className="flex items-center gap-3">
                {/* 뒤로가기 버튼 */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="
                    w-11
                    h-11

                    flex
                    items-center
                    justify-center

                    rounded-full
                    bg-white
                    border
                    border-gray-200

                    shadow-sm

                    text-xl
                    font-bold

                    hover:bg-gray-100
                    transition
                  "
                >
                  ←
                </button>

                {/* 제목 */}
                <h1 className="text-2xl font-bold">
                  디키캠프 FAQ
                </h1>
              </div>

              {/* 종료 버튼 */}
              <button
                onClick={() => setIsOpen(false)}
                className="
                  w-11
                  h-11

                  flex
                  items-center
                  justify-center

                  rounded-full
                  bg-white
                  border
                  border-gray-200

                  shadow-sm

                  text-2xl

                  hover:bg-gray-100
                  transition
                "
              >
                ✕
              </button>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto px-5 pb-10">
              {/* 카테고리 */}
              <div className="flex gap-2 overflow-x-auto mb-6 pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      setSelectedCategory(category)
                    }
                    className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition
                      
                      ${
                        selectedCategory === category
                          ? "bg-[#FFE66D] text-black font-semibold"
                          : "bg-white border border-gray-200"
                      }
                    `}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* FAQ 리스트 */}
              <div className="space-y-4">
                {filteredFaq.map((item) => (
                  <div
                    key={item.id}
                    className="
                      bg-white
                      rounded-2xl
                      shadow-sm
                      border
                      border-gray-200
                      overflow-hidden
                    "
                  >
                    {/* 질문 */}
                    <button
                      onClick={() =>
                        toggleAnswer(item.id)
                      }
                      className="w-full text-left p-5"
                    >
                      <div className="text-sm text-orange-400 mb-2">
                        {item.대분류}
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="font-semibold text-base leading-relaxed">
                          Q. {item.질문}
                        </div>

                        <div className="text-xl ml-3">
                          {openId === item.id
                            ? "−"
                            : "+"}
                        </div>
                      </div>
                    </button>

                    {/* 답변 */}
                    {openId === item.id && (
                      <div className="px-5 pb-5 text-sm text-gray-600 whitespace-pre-line leading-relaxed">
                        A. {item.답변}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 문의하기 버튼 */}
              <a
                href="https://tally.so/r/eq02Qk"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  block
                  w-full
                  mt-6
                  bg-[#FFE66D]
                  rounded-2xl
                  py-4
                  font-semibold
                  text-lg
                  text-center
                "
              >
                문의하기
              </a>
            </div>
          </div>
        </>
      )}
    </>
  );
}