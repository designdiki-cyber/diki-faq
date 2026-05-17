"use client";

import { useEffect, useMemo, useState } from "react";

export default function FaqWidget() {
  const [faq, setFaq] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [openId, setOpenId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [recentQuestions, setRecentQuestions] = useState<any[]>([]);

  useEffect(() => {
    fetch(
      "https://script.google.com/macros/s/AKfycbzzJmzvecQ9_W7sGh3bXKVSxZlLJ6B2l9HimstJUEdeZjD2iUzU0g0IvOkJ8zgTMtdN/exec"
    )
      .then((res) => res.json())
      .then((data) => {
        setFaq(data.faq || []);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const categories = [
    "전체",
    "비용 문의",
    "캠프 모집 및 신청 문의",
    "일정 문의",
    "캠프 프로그램 문의",
    "주차 문의",
    "직접 문의",
  ];

  const normalize = (text: string) =>
    text
      ?.toLowerCase()
      .replace(/\s/g, "")
      .replace(/문의/g, "");

  const filteredFaq = useMemo(() => {
    const keyword = normalize(search);

    return faq.filter((item) => {
      const category = normalize(item["대분류"] || "");
      const question = normalize(item["질문"] || "");
      const answer = normalize(item["답변"] || "");

      const categoryMatch =
        selectedCategory === "전체"
          ? true
          : item["대분류"] === selectedCategory;

      const searchMatch =
        keyword === "" ||
        category.includes(keyword) ||
        question.includes(keyword) ||
        answer.includes(keyword);

      return categoryMatch && searchMatch;
    });
  }, [faq, selectedCategory, search]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-6 w-[92px] h-[108px] rounded-[28px] bg-white border border-[#ece7df] shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02]"
      >

        <div className="w-[52px] h-[52px] rounded-[18px] bg-[#FFF4B8] flex items-center justify-center border border-[#f3e39c]">

          <img
            src="/diki-character.png"
            alt="디키캐릭터"
            className="w-[34px] h-[34px] object-contain"
          />

        </div>

        <div className="text-center leading-tight">

          <p className="text-[14px] font-bold text-[#111111]">
            디키캠프
          </p>

          <p className="text-[13px] text-[#777777] font-medium mt-1">
            문의
          </p>

        </div>

      </button>
    );
  }

  return (
    <div className="fixed right-6 bottom-6 w-[440px] h-[90vh] bg-[#f8f7f4] rounded-[34px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-[#ebe7df] overflow-hidden flex flex-col font-['Pretendard']">

      {/* 헤더 */}
      <div className="bg-white px-6 py-6 border-b border-[#e8e4dc] flex items-start justify-between">

        <div>
          <h1 className="text-[24px] font-bold text-[#111111] tracking-[-0.02em]">
            디키캠프 FAQ
          </h1>

          <p className="mt-3 text-[13px] text-[#8d8d8d] font-medium">
            빠르게 답변을 확인해보세요
          </p>
        </div>

        <button
          onClick={() => {
            setIsOpen(false);
            setOpenId(null);
            setSearch("");
            setSelectedCategory("전체");
            setRecentQuestions([]);
          }}
          className="w-12 h-12 rounded-full bg-[#f5f5f3] text-[30px] text-[#7c7c7c] flex items-center justify-center"
        >
          ×
        </button>

      </div>

      {/* 스크롤 */}
      <div className="flex-1 overflow-y-auto">

        {/* 상단 카드 */}
        <div className="p-6">

          <div className="bg-white rounded-[34px] border border-[#ece7df] px-7 pt-7 pb-8 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">

            <div className="w-[74px] h-[74px] rounded-[24px] bg-[#FFF4B8] flex items-center justify-center border border-[#f3e39c] shadow-sm">

              <img
                src="/diki-character.png"
                alt="디키캐릭터"
                className="w-[46px] h-[46px] object-contain"
              />

            </div>

            <h2 className="mt-7 text-[22px] font-bold leading-[1.45] text-[#111111] tracking-[-0.02em]">
              안녕하세요.
              <br />
              디키캠프 FAQ입니다.
            </h2>

            <p className="mt-6 text-[16px] leading-[1.9] text-[#707070] font-medium">
              궁금한 카테고리를 선택하거나
              <br />
              검색으로 빠르게 찾아보세요.
            </p>

          </div>

        </div>

        {/* 검색 */}
        <div className="px-6">

          <div className="bg-white h-[64px] rounded-[24px] border border-[#ebe6de] px-6 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">

            <span className="text-[20px]">
              🔎
            </span>

            <input
              type="text"
              placeholder="궁금한 내용을 검색해보세요"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedCategory("전체");
              }}
              className="w-full bg-transparent outline-none text-[15px] text-[#111111] placeholder:text-[#b5b5b5] font-medium"
            />

          </div>

        </div>

        {/* 최근 질문 */}
        <div className="px-6 mt-9">

          <h3 className="text-[15px] font-bold text-[#555555] mb-4">
            최근 본 질문
          </h3>

          <div className="flex gap-3 overflow-x-auto pb-2">

            {recentQuestions.length > 0
              ? recentQuestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedCategory(item["대분류"]);
                      setOpenId(item.id);
                    }}
                    className="bg-white border border-[#ebe6de] rounded-full px-5 h-[44px] text-[13px] whitespace-nowrap shadow-sm font-medium text-[#333333]"
                  >
                    {item["질문"]}
                  </button>
                ))
              : faq.slice(0, 2).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedCategory(item["대분류"]);
                      setOpenId(item.id);
                    }}
                    className="bg-white border border-[#ebe6de] rounded-full px-5 h-[44px] text-[13px] whitespace-nowrap shadow-sm font-medium text-[#333333]"
                  >
                    {item["질문"]}
                  </button>
                ))}

          </div>

        </div>

        {/* 카테고리 */}
        <div className="px-6 mt-8 flex flex-wrap gap-3">

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSearch("");
              }}
              className={`h-[52px] px-6 rounded-full border text-[14px] font-semibold transition-all shadow-sm
              ${
                selectedCategory === category
                  ? "bg-[#FFE66D] border-[#f2d85d] text-[#111111]"
                  : "bg-white border-[#ebe6de] text-[#444444]"
              }`}
            >
              {category}
            </button>
          ))}

        </div>

        {/* 타이틀 */}
        <div className="px-6 mt-11">

          <h2 className="text-[30px] font-bold text-[#111111] tracking-[-0.03em]">
            {search ? "검색 결과" : selectedCategory}
          </h2>

          <p className="mt-3 text-[14px] text-[#7d7d7d]">
            자주 묻는 질문을 확인해보세요.
          </p>

        </div>

        {/* FAQ */}
        <div className="p-6 space-y-5">

          {filteredFaq.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-[#ebe6de] rounded-[30px] shadow-[0_4px_20px_rgba(0,0,0,0.04)] overflow-hidden"
            >

              <button
                onClick={() => {
                  setOpenId(openId === item.id ? null : item.id);

                  const updatedRecent = [
                    item,
                    ...recentQuestions.filter((q) => q.id !== item.id),
                  ].slice(0, 2);

                  setRecentQuestions(updatedRecent);
                }}
                className="w-full px-7 py-6 text-left flex items-start justify-between gap-4"
              >

                <div>

                  <p className="text-[11px] text-[#a2a2a2] font-semibold">
                    {item["대분류"]}
                  </p>

                  <h3 className="mt-3 text-[18px] leading-[1.6] font-bold text-[#111111] tracking-[-0.02em]">
                    {item["질문"]}
                  </h3>

                </div>

                <div className="text-[28px] text-[#7f7f7f] leading-none mt-1">
                  {openId === item.id ? "−" : "+"}
                </div>

              </button>

              {openId === item.id && (

                <div className="px-7 pb-7 border-t border-[#f0ece5] bg-[#fffdf9]">

                  <div className="pt-7 text-[15px] leading-[2] text-[#555555] whitespace-pre-line font-medium">
                    {item["답변"]
                      ?.replace(/https?:\/\/\S+/g, "")
                      ?.replace(/얼리버드 알림 신청\s*:/g, "")
                      ?.replace(/기존 참여자 특별 혜택가 신청\s*:/g, "")
                    }
                  </div>

                  {(
                    item["질문"]?.includes("예약 오픈 알림") ||
                    item["질문"]?.includes("예약 오픈 알림 링크") ||
                    item["질문"]?.includes("예약 오픈 일정")
                  ) && (

                    <div className="mt-7 space-y-3">

                      <a
                        href="https://forms.gle/xqJi7gUYcmr5TQjg9"
                        target="_blank"
                        className="w-full h-[58px] rounded-[22px] bg-[#FFE66D] text-[#111111] font-bold text-[15px] flex items-center justify-center shadow-sm"
                      >
                        얼리버드 알림 신청
                      </a>

                      <a
                        href="https://forms.gle/yZrexPjTaUTQ38zQA"
                        target="_blank"
                        className="w-full h-[58px] rounded-[22px] bg-[#FFE66D] text-[#111111] font-bold text-[15px] flex items-center justify-center shadow-sm"
                      >
                        기존 참가자 특별 혜택가 신청
                      </a>

                    </div>

                  )}

                </div>

              )}

            </div>
          ))}

          {filteredFaq.length === 0 && (
            <div className="text-center text-[#888888] py-12 text-[15px]">
              검색 결과가 없습니다.
            </div>
          )}

        </div>

      </div>

      {/* 문의 */}
      <div className="bg-white border-t border-[#ebe7df] p-5">

        <a
          href="https://forms.gle/kLsuSKLbVSa9sE1B8"
          target="_blank"
          className="w-full h-[60px] rounded-[24px] bg-[#FFE66D] text-[#111111] font-bold text-[17px] flex items-center justify-center shadow-sm"
        >
          문의 남기기
        </a>

      </div>

    </div>
  );
}