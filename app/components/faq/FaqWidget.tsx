"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type FAQ = {
  id: number;
  category: string;
  question: string;
  answer: string;
};

export default function FaqWidget() {
  /*
  =========================
  상태관리
  =========================
  */

  const [isOpen, setIsOpen] = useState(false);

  const [faqs, setFaqs] = useState<FAQ[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("");

  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);

  const [searchText, setSearchText] = useState("");

  /*
  =========================
  FAQ API
  =========================
  */

  useEffect(() => {
    fetch(
      "https://script.google.com/macros/s/AKfycbySZO6JhOmM98uUuZ4Bvl2XnJd090f0JiNQen1dyg7PjXxogtRpv9Mtxb4BxrfE2mnq/exec"
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("FAQ 데이터:", data);

        setFaqs(data.faq || []);
      })
      .catch((err) => {
        console.error("FAQ API 오류:", err);
      });
  }, []);

  /*
  =========================
  카테고리
  =========================
  */

  const categories = useMemo(() => {
    return [...new Set(faqs.map((item) => item.category))];
  }, [faqs]);

  /*
  =========================
  추천 질문
  =========================
  */

  const recommendedFaqs = useMemo(() => {
    if (!searchText.trim()) return [];

    return faqs.filter((item) => {
      return (
        item.question.includes(searchText) ||
        item.answer.includes(searchText) ||
        item.category.includes(searchText)
      );
    });
  }, [searchText, faqs]);

  /*
  =========================
  선택 카테고리 질문
  =========================
  */

  const categoryFaqs = useMemo(() => {
    return faqs.filter(
      (item) => item.category === selectedCategory
    );
  }, [selectedCategory, faqs]);

  /*
  =========================
  닫힌 상태
  =========================
  */

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed
          bottom-6
          right-6
          bg-[#F8F7F2]
          border
          border-gray-200
          rounded-[30px]
          shadow-2xl
          px-4
          py-4
          z-[9999]
          hover:scale-105
          transition
        "
      >
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/diki-character.png"
            alt="디키"
            width={60}
            height={60}
          />

          <p
            className="
              text-[15px]
              font-bold
              leading-tight
              text-[#111827]
            "
          >
            디키캠프
            <br />
            문의
          </p>
        </div>
      </button>
    );
  }

  /*
  =========================
  열린 상태
  =========================
  */

  return (
    <>
      {/* 배경 */}
      <div
        className="
          fixed
          inset-0
          bg-black/30
          z-40
          pointer-events-none
        "
      />

      {/* 패널 */}
      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          h-[92vh]
          bg-[#F8F7F2]
          z-50
          rounded-t-[34px]
          shadow-2xl
          overflow-hidden
          flex
          flex-col
        "
      >
        {/* 핸들 */}
        <div className="pt-3 pb-2 flex justify-center">
          <div className="w-14 h-[5px] rounded-full bg-gray-300" />
        </div>

        {/* 헤더 */}
        <div
          className="
            px-6
            py-5
            border-b
            border-gray-200
            flex
            items-center
            justify-between
          "
        >
          {/* 뒤로가기 */}
          <button
            onClick={() => {
              setSelectedCategory("");
              setSelectedFaq(null);
              setSearchText("");
            }}
            className="
              w-12
              h-12
              rounded-full
              bg-white
              shadow
              border
              border-gray-200
              text-[24px]
            "
          >
            ←
          </button>

          {/* 타이틀 */}
          <h2
            className="
              text-[28px]
              font-extrabold
              tracking-[-0.03em]
              text-[#111827]
            "
          >
            디키캠프 FAQ
          </h2>

          {/* 종료 */}
          <button
            onClick={() => setIsOpen(false)}
            className="
              w-12
              h-12
              rounded-full
              bg-white
              shadow
              border
              border-gray-200
              text-[24px]
            "
          >
            ×
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* 메인 첫 화면 */}
          {!selectedCategory && !selectedFaq && (
            <>
              {/* 캐릭터 */}
              <div className="flex items-start gap-4 mb-6">
                <Image
                  src="/diki-character.png"
                  alt="디키"
                  width={74}
                  height={74}
                />

                <div>
                  <h3
                    className="
                      text-[24px]
                      font-extrabold
                      leading-snug
                      text-[#111827]
                    "
                  >
                    안녕하세요 :)
                    <br />
                    무엇이 궁금하신가요?
                  </h3>

                  <p
                    className="
                      text-[15px]
                      text-gray-500
                      mt-2
                    "
                  >
                    선택하거나 직접 질문해보세요.
                  </p>
                </div>
              </div>

              {/* 검색 */}
              <div
                className="
                  bg-white
                  rounded-[24px]
                  shadow-md
                  border
                  border-gray-200
                  px-5
                  py-4
                  mb-8
                  flex
                  items-center
                  gap-3
                "
              >
                <input
                  type="text"
                  placeholder="예: 가격 얼마인가요?"
                  value={searchText}
                  onChange={(e) =>
                    setSearchText(e.target.value)
                  }
                  className="
                    flex-1
                    outline-none
                    text-[17px]
                    bg-transparent
                  "
                />

                <div
                  className="
                    text-gray-400
                    text-[20px]
                  "
                >
                  ✈
                </div>
              </div>

              {/* 추천 질문 */}
              {recommendedFaqs.length > 0 && (
                <div className="mb-10">
                  <p
                    className="
                      text-[15px]
                      font-bold
                      text-[#FF6B00]
                      mb-4
                    "
                  >
                    추천 질문
                  </p>

                  <div className="flex flex-col gap-3">
                    {recommendedFaqs.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedFaq(item);
                        }}
                        className="
                          bg-white
                          rounded-[22px]
                          border
                          border-gray-200
                          px-5
                          py-4
                          text-left
                          shadow-sm
                        "
                      >
                        <p
                          className="
                            text-[16px]
                            font-semibold
                            text-[#111827]
                          "
                        >
                          {item.question}
                        </p>

                        <p
                          className="
                            text-[13px]
                            text-gray-500
                            mt-1
                          "
                        >
                          {item.category}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 빠른 선택 */}
              <div>
                <p
                  className="
                    text-[15px]
                    font-bold
                    text-[#FF6B00]
                    mb-4
                  "
                >
                  빠른 선택
                </p>

                <div className="flex flex-col gap-5">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(category)
                      }
                      className="
                        bg-white
                        rounded-[28px]
                        border
                        border-gray-200
                        p-6
                        text-left
                        shadow-sm
                        flex
                        items-center
                        justify-between
                        hover:shadow-md
                        transition
                      "
                    >
                      <div>
                        <p
                          className="
                            text-[14px]
                            font-bold
                            text-[#FF6B00]
                            mb-2
                          "
                        >
                          추천 메뉴
                        </p>

                        <h3
                          className="
                            text-[22px]
                            font-extrabold
                            text-[#111827]
                          "
                        >
                          {category}
                        </h3>
                      </div>

                      <span
                        className="
                          text-[34px]
                          text-gray-300
                        "
                      >
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 카테고리 질문 */}
          {selectedCategory && !selectedFaq && (
            <div>
              <p
                className="
                  text-[15px]
                  font-bold
                  text-[#FF6B00]
                  mb-5
                "
              >
                {selectedCategory}
              </p>

              <div className="flex flex-col gap-4">
                {categoryFaqs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedFaq(item)}
                    className="
                      bg-white
                      rounded-[24px]
                      border
                      border-gray-200
                      p-5
                      text-left
                      shadow-sm
                    "
                  >
                    <p
                      className="
                        text-[18px]
                        font-bold
                        text-[#111827]
                      "
                    >
                      {item.question}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 답변 */}
          {selectedFaq && (
            <div
              className="
                bg-white
                rounded-[28px]
                border
                border-gray-200
                p-6
                shadow-sm
              "
            >
              <p
                className="
                  text-[14px]
                  font-bold
                  text-[#FF6B00]
                  mb-3
                "
              >
                {selectedFaq.category}
              </p>

              <h3
                className="
                  text-[24px]
                  font-extrabold
                  text-[#111827]
                  leading-snug
                  mb-5
                "
              >
                {selectedFaq.question}
              </h3>

              <div
                className="
                  text-[18px]
                  leading-[1.9]
                  text-gray-700
                  whitespace-pre-line
                "
              >
                {selectedFaq.answer}
              </div>

              {/* 문의 버튼 */}
              <a
                href="https://tally.so/r/eq02Qk"
                target="_blank"
                className="
                  mt-8
                  w-full
                  bg-[#FF6B00]
                  text-white
                  rounded-2xl
                  py-4
                  text-center
                  font-bold
                  text-[17px]
                  block
                "
              >
                추가 문의하기
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}