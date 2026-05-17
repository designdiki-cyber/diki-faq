"use client";

import Image from "next/image";

import {
  motion,
  AnimatePresence,
} from "framer-motion";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import FloatingButton from "./components/faq/FloatingButton";

const API_URL =
  "https://script.google.com/macros/s/AKfycbySZO6JhOmM98uUuZ4Bvl2XnJd090f0JiNQen1dyg7PjXxogtRpv9Mtxb4BxrfE2mnq/exec";

const EARLY_BIRD_URL =
  "https://forms.gle/rHWzxQWP7VMryS6Z6";

type FAQItem = {
  id: string;
  대분류: string;
  질문: string;
  답변: string;
};

export default function Home() {
  const [open, setOpen] =
    useState(false);

  const [faqData, setFaqData] =
    useState<FAQItem[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState<string | null>(null);

  const [openedQuestion, setOpenedQuestion] =
    useState<string | null>(null);

  const [recentQuestions, setRecentQuestions] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [searchText, setSearchText] =
    useState("");

  /**
   * 최근 질문 저장 불러오기
   */
  useEffect(() => {
    const saved =
      localStorage.getItem(
        "recentQuestions"
      );

    if (saved) {
      setRecentQuestions(
        JSON.parse(saved)
      );
    }
  }, []);

  /**
   * FAQ 데이터 가져오기
   */
  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setFaqData(data.faq || []);

        setLoading(false);
      })
      .catch((error) => {
        console.error(error);

        setLoading(false);
      });
  }, []);

  /**
   * 카테고리 목록
   */
  const categories = [
    ...new Set(
      faqData.map(
        (item) => item.대분류
      )
    ),
  ];

  /**
   * 검색 normalize
   */
  const normalizeText = (
    text: string
  ) => {
    return text
      .replace(/\s/g, "")
      .toLowerCase();
  };

  /**
   * FAQ 필터
   */
  const filteredFaq = useMemo(() => {
    let result = faqData;

    // 카테고리 선택 시
    if (
      selectedCategory &&
      searchText.trim() === ""
    ) {
      result = result.filter(
        (item) =>
          item.대분류 ===
          selectedCategory
      );
    }

    // 검색
    const normalizedSearch =
      normalizeText(searchText);

    if (normalizedSearch !== "") {
      result = result.filter(
        (item) => {
          const question =
            normalizeText(
              item.질문
            );

          const answer =
            normalizeText(
              item.답변
            );

          const category =
            normalizeText(
              item.대분류
            );

          return (
            question.includes(
              normalizedSearch
            ) ||
            answer.includes(
              normalizedSearch
            ) ||
            category.includes(
              normalizedSearch
            )
          );
        }
      );
    }

    return result;
  }, [
    faqData,
    selectedCategory,
    searchText,
  ]);

  return (
    <main className="relative min-h-screen bg-[#FFFDF6]">
      {/* 플로팅 버튼 */}
      {!open && (
        <FloatingButton
          onClick={() =>
            setOpen(true)
          }
        />
      )}

      {/* 팝업 */}
      {open && (
        <div
          className="
            fixed
            inset-0
            z-[9998]
            bg-black/20
            flex
            items-end
            md:items-center
            md:justify-end
            p-0
            md:p-5
          "
        >
          {/* 챗봇 */}
          <div
            className="
              w-full
              md:w-[420px]
              h-[92vh]
              bg-[#F7F7F7]
              rounded-t-[32px]
              md:rounded-[32px]
              overflow-hidden
              flex
              flex-col
              shadow-2xl
            "
          >
            {/* 헤더 */}
            <div className="bg-white border-b px-5 py-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[22px] text-[#222]">
                  디키캠프 FAQ
                </h2>

                <p className="text-sm text-[#888] mt-1">
                  빠르게 답변을 확인해보세요
                </p>
              </div>

              <button
                onClick={() =>
                  setOpen(false)
                }
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-[#F3F3F3]
                  text-[#555]
                  text-lg
                "
              >
                ✕
              </button>
            </div>

            {/* 내용 */}
            <div className="flex-1 overflow-y-auto px-5 py-6">
              {/* 인사 카드 */}
              <div className="bg-white rounded-[28px] p-6 shadow-sm mb-6">
                <div className="mb-5">
                  <div
                    className="
                      relative
                      w-[56px]
                      h-[56px]
                      rounded-2xl
                      bg-[#FFF7CC]
                      flex
                      items-center
                      justify-center
                    "
                  >
                    <Image
                      src="/diki-character.png"
                      alt="디키캐릭터"
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>
                </div>

                <h3 className="text-[32px] leading-tight font-bold text-[#222] mb-4">
                  안녕하세요.
                  <br />
                  디키캠프 FAQ입니다.
                </h3>

                <p className="text-[#777] leading-relaxed">
                  궁금한 카테고리를 선택하거나
                  <br />
                  검색으로 빠르게 찾아보세요.
                </p>
              </div>

              {/* 검색 */}
              <div className="mb-6">
                <div
                  className="
                    bg-white
                    rounded-2xl
                    px-4
                    py-4
                    shadow-sm
                    flex
                    items-center
                    gap-3
                  "
                >
                  <span className="text-lg">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) =>
                      setSearchText(
                        e.target.value
                      )
                    }
                    placeholder="궁금한 내용을 검색해보세요"
                    className="
                      flex-1
                      outline-none
                      bg-transparent
                      text-sm
                      text-[#222]
                      placeholder:text-[#AAA]
                    "
                  />
                </div>
              </div>

              {/* 최근 질문 */}
              {recentQuestions.length >
                0 && (
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-[#666] mb-3">
                    최근 본 질문
                  </h4>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {recentQuestions.map(
                      (question) => (
                        <button
                          key={question}
                          onClick={() =>
                            setSearchText(
                              question
                            )
                          }
                          className="
                            bg-white
                            px-4
                            py-2
                            rounded-full
                            text-xs
                            shadow-sm
                            text-[#555]
                            whitespace-nowrap
                          "
                        >
                          {question}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* 로딩 */}
              {loading && (
                <div className="text-center text-[#888] py-10">
                  FAQ 불러오는 중...
                </div>
              )}

              {/* 카테고리 */}
              {!loading && (
                <div className="flex flex-wrap gap-3 mb-8">
                  {categories.map(
                    (category) => {
                      const active =
                        selectedCategory ===
                        category;

                      return (
                        <button
                          key={category}
                          onClick={() => {
                            setSelectedCategory(
                              category
                            );

                            setOpenedQuestion(
                              null
                            );

                            setSearchText(
                              ""
                            );
                          }}
                          className={`
                            px-5
                            py-3
                            rounded-full
                            text-sm
                            font-semibold
                            transition-all
                            shadow-sm
                            ${
                              active
                                ? "bg-[#FFE66D] text-[#222]"
                                : "bg-white text-[#444]"
                            }
                          `}
                        >
                          {category}
                        </button>
                      );
                    }
                  )}
                </div>
              )}

              {/* 질문 리스트 */}
              {(selectedCategory ||
                searchText) && (
                <div className="space-y-4">
                  <div className="mb-2">
                    <h4 className="text-lg font-bold text-[#222]">
                      {searchText
                        ? "검색 결과"
                        : selectedCategory}
                    </h4>

                    <p className="text-sm text-[#888] mt-1">
                      자주 묻는 질문을 확인해보세요.
                    </p>
                  </div>

                  {filteredFaq.map(
                    (item) => {
                      const opened =
                        openedQuestion ===
                        item.질문;

                      const urls =
                        item.답변?.match(
                          /https?:\/\/[^\s]+/g
                        ) || [];

                      return (
                        <div
                          key={item.id}
                          className="
                            bg-white
                            rounded-[24px]
                            overflow-hidden
                            shadow-sm
                          "
                        >
                          {/* 질문 */}
                          <button
                            onClick={() => {
                              setOpenedQuestion(
                                opened
                                  ? null
                                  : item.질문
                              );

                              if (
                                !recentQuestions.includes(
                                  item.질문
                                )
                              ) {
                                const updated =
                                  [
                                    item.질문,
                                    ...recentQuestions,
                                  ].slice(
                                    0,
                                    2
                                  );

                                setRecentQuestions(
                                  updated
                                );

                                localStorage.setItem(
                                  "recentQuestions",
                                  JSON.stringify(
                                    updated
                                  )
                                );
                              }
                            }}
                            className="
                              w-full
                              px-5
                              py-5
                              text-left
                              flex
                              justify-between
                              items-center
                            "
                          >
                            <div>
                              <div className="text-xs text-[#999] mb-1">
                                {
                                  item.대분류
                                }
                              </div>

                              <span className="font-semibold text-[#222]">
                                {
                                  item.질문
                                }
                              </span>
                            </div>

                            <span className="text-xl">
                              {opened
                                ? "−"
                                : "+"}
                            </span>
                          </button>

                          {/* 답변 */}
                          <AnimatePresence>
                            {opened && (
                              <motion.div
                                initial={{
                                  height: 0,
                                  opacity: 0,
                                }}
                                animate={{
                                  height:
                                    "auto",
                                  opacity: 1,
                                }}
                                exit={{
                                  height: 0,
                                  opacity: 0,
                                }}
                                transition={{
                                  duration: 0.25,
                                }}
                                className="overflow-hidden"
                              >
                                <div
                                  className="
                                    px-5
                                    pb-5
                                    pt-5
                                    border-t
                                    text-[15px]
                                    leading-[1.7]
                                    text-[#555]
                                    whitespace-pre-line
                                  "
                                >
                                  {/* 답변 텍스트 */}
                                  <div>
                                    {item.답변
                                      ?.replace(
                                        /https?:\/\/[^\s]+/g,
                                        ""
                                      )

                                      // 캠프명 정리
                                      ?.replace(
                                        /\[캠프 A\]/g,
                                        "\n\n[캠프 A]"
                                      )
                                      ?.replace(
                                        /\[캠프 B\]/g,
                                        "\n\n[캠프 B]"
                                      )

                                      // 숫자 정리
                                      ?.replace(
                                        /1\.\s*/g,
                                        "\n\n1. "
                                      )
                                      ?.replace(
                                        /2\.\s*/g,
                                        "\n\n2. "
                                      )
                                      ?.replace(
                                        /3\.\s*/g,
                                        "\n\n3. "
                                      )

                                      // 줄바꿈 정리
                                      ?.replace(
                                        /\n{3,}/g,
                                        "\n\n"
                                      )}
                                  </div>

                                  {/* 신청 버튼 */}
                                  {item.대분류 ===
                                    "캠프 모집 및 신청 문의" && (
                                    <div className="mt-5 flex flex-col gap-3">
                                      {/* 얼리버드 */}
                                      <button
                                        onClick={() =>
                                          window.open(
                                            EARLY_BIRD_URL,
                                            "_blank"
                                          )
                                        }
                                        className="
                                          w-full
                                          bg-[#FFE66D]
                                          hover:bg-[#FFD93D]
                                          transition
                                          rounded-2xl
                                          py-3
                                          font-semibold
                                          text-[#222]
                                          text-sm
                                        "
                                      >
                                        얼리버드 알림 신청
                                      </button>

                                      {/* 특별 혜택 */}
                                      {urls.length >
                                        0 && (
                                        <button
                                          onClick={() =>
                                            window.open(
                                              urls[0],
                                              "_blank"
                                            )
                                          }
                                          className="
                                            w-full
                                            bg-[#FFE66D]
                                            hover:bg-[#FFD93D]
                                            transition
                                            rounded-2xl
                                            py-3
                                            font-semibold
                                            text-[#222]
                                            text-sm
                                          "
                                        >
                                          기존 참가자 특별 혜택가 신청
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    }
                  )}

                  {/* 검색 결과 없음 */}
                  {filteredFaq.length ===
                    0 && (
                    <div className="text-center text-[#999] py-10">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 문의 버튼 */}
            <div className="bg-white border-t p-4">
              <button
                onClick={() =>
                  window.open(
                    "https://forms.gle/RHktHWuDK7Ajxiut7",
                    "_blank"
                  )
                }
                className="
                  w-full
                  bg-[#FFE66D]
                  py-4
                  rounded-2xl
                  font-bold
                  text-[#222]
                  active:scale-[0.98]
                  transition
                "
              >
                문의 남기기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}