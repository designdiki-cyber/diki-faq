"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

type RawFaqItem = { [key: string]: unknown };

type FaqItem = {
  id: string;
  category: string;
  subCategory: string;
  question: string;
  answer: string;
  order: number;
};

const API_URL =
  "https://script.google.com/macros/s/AKfycbzzJmzvecQ9_W7sGh3bXKVSxZlLJ6B2l9HimstJUEdeZjD2iUzU0g0IvOkJ8zgTMtdN/exec";

const GOOGLE_FORM_URL = "https://forms.gle/ghdmocNRvzdEALiX8";
const EARLY_BIRD_FORM_URL = "https://forms.gle/EDzy7oc8wXzFvz4o6";
const BENEFIT_FORM_URL = "https://forms.gle/bXCbxmxXqfkwDKt48";

const CATEGORY_ORDER = [
  "전체",
  "비용 문의",
  "캠프 모집 및 신청 문의",
  "일정 문의",
  "캠프 프로그램 문의",
  "주차 문의",
  "직접 문의",
  "예약알림",
];

const DEFAULT_SEARCH_HINTS = ["참가비는 얼마인가요?", "예약 오픈 알림"];

const FIXED_RESERVATION_ANSWERS: Record<string, string> = {
  "예약오픈알림서비스는어떻게신청하나요?": `디키캠프는 예약 오픈 알림 서비스를 운영하고 있습니다.
사전에 신청해주시면 예약 일정에 맞춰 문자로 안내를 받아보실 수 있습니다.`,

  "예약오픈알림문자는언제발송되나요?": `예약 오픈 알림 서비스를 신청하신 경우, 예약 오픈일 당일 오픈 시간 약 30분 전에 문자로 안내드립니다.`,

  "예약오픈알림링크를통해바로예약가능한가요?": `예약 오픈 알림 문자에 포함된 링크는 디키캠프 상세 안내 페이지로 연결됩니다.
상세 내용을 확인하신 후 페이지 하단의 신청 링크를 통해 예약을 진행해주셔야 합니다.`,

  "캠프예약오픈일정은언제인가요?": `[기존 참여자 특별 혜택가] 7월 16일 화요일 오후 4시
[얼리버드 예약 오픈] 7월 18일 목요일 오후 4시
세부 모집 인원은 일정별로 상이할 수 있습니다.`,
};

const SEARCH_SYNONYM_GROUPS = [
  ["비용", "참가비", "참가비용", "금액", "가격", "요금", "얼마", "결제", "입금"],
  ["모집", "신청", "접수", "등록", "지원", "예약"],
  ["알림", "예약알림", "오픈알림", "문자", "얼리버드", "혜택가"],
  ["일정", "스케줄", "날짜", "기간", "언제", "시간"],
  ["주차", "주차장", "차량", "주차비"],
  ["프로그램", "커리큘럼", "수업", "활동", "놀이"],
  ["문의", "연락", "상담", "전화", "카카오톡"],
];

const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 700;

function toText(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s/g, "");
}

function getFixedAnswer(item: FaqItem) {
  return FIXED_RESERVATION_ANSWERS[normalizeText(item.question)] || item.answer;
}

function isVisibleItem(item: RawFaqItem) {
  const visibleValue = item["노출여부"] ?? item["visible"] ?? item["isVisible"];
  if (visibleValue === undefined || visibleValue === null || visibleValue === "") return true;
  if (typeof visibleValue === "boolean") return visibleValue;

  const text = String(visibleValue).trim().toLowerCase();
  return !["false", "n", "no", "0", "x", "미노출", "숨김", "비공개"].includes(text);
}

function normalizeFaqList(rawList: RawFaqItem[]): FaqItem[] {
  return rawList
    .filter(isVisibleItem)
    .map((item, index) => ({
      id: toText(item["id"]) || toText(item["ID"]) || toText(item["번호"]) || String(index + 1),
      category: toText(item["category"]) || toText(item["대분류"]) || toText(item["카테고리"]) || "기타",
      subCategory: toText(item["subCategory"]) || toText(item["중분류"]) || "",
      question: toText(item["question"]) || toText(item["질문"]) || "",
      answer: toText(item["answer"]) || toText(item["답변"]) || "",
      order: Number(toText(item["order"]) || toText(item["정렬순서"]) || index + 1),
    }))
    .filter((item) => item.question && item.answer)
    .sort((a, b) => a.order - b.order);
}

function getSearchKeywords(search: string) {
  const normalizedSearch = normalizeText(search);
  const keywords = new Set<string>();
  if (normalizedSearch) keywords.add(normalizedSearch);

  SEARCH_SYNONYM_GROUPS.forEach((group) => {
    const normalizedGroup = group.map(normalizeText);
    if (normalizedGroup.some((word) => normalizedSearch.includes(word))) {
      normalizedGroup.forEach((word) => keywords.add(word));
    }
  });

  return Array.from(keywords);
}

function isReservationAlertItem(item: FaqItem) {
  return normalizeText(item.question) === normalizeText("예약 오픈 알림 서비스는 어떻게 신청하나요?");
}

function renderAnswerText(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => (
      <p key={`${line}-${index}`} className="mb-2 last:mb-0">
        {line}
      </p>
    ));
}

export default function FaqWidget() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [faqList, setFaqList] = useState<FaqItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [hasCategoryClicked, setHasCategoryClicked] = useState(false);
  const [search, setSearch] = useState("");
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragInfo = useRef({ offsetX: 0, offsetY: 0 });
  const rafRef = useRef<number | null>(null);

  const shouldShowFaqList = search.trim() !== "" || hasCategoryClicked;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const updateDevice = () => setIsMobile(window.innerWidth < 768);
    updateDevice();
    window.addEventListener("resize", updateDevice);
    return () => window.removeEventListener("resize", updateDevice);
  }, []);

  useEffect(() => {
    async function fetchFaq() {
      try {
        setIsLoading(true);
        setLoadError("");

        const response = await fetch(API_URL, { cache: "no-store" });
        const data = await response.json();

        const rawList = Array.isArray(data)
          ? data
          : Array.isArray(data.faq)
          ? data.faq
          : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.data)
          ? data.data
          : [];

        setFaqList(normalizeFaqList(rawList));
      } catch {
        setLoadError("FAQ 데이터를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchFaq();
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const resetWidgetState = () => {
    setSearch("");
    setSelectedCategory("전체");
    setHasCategoryClicked(false);
    setOpenedId(null);
  };

  const openWidget = () => {
    resetWidgetState();

    if (window.innerWidth >= 768) {
      const width = Math.min(POPUP_WIDTH, window.innerWidth - 32);
      const height = Math.min(POPUP_HEIGHT, window.innerHeight * 0.85);

      setPosition({
        x: Math.max(16, (window.innerWidth - width) / 2),
        y: Math.max(24, (window.innerHeight - height) / 2),
      });
    }

    setIsOpen(true);
  };

  const closeWidget = () => {
    setIsOpen(false);
    setIsDragging(false);
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (isMobile) return;

    const popup = event.currentTarget.closest("[data-faq-popup='true']") as HTMLDivElement | null;
    if (!popup) return;

    const rect = popup.getBoundingClientRect();
    dragInfo.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (isMobile || !isDragging) return;

    const clientX = event.clientX;
    const clientY = event.clientY;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const width = Math.min(POPUP_WIDTH, window.innerWidth - 32);
      const height = Math.min(POPUP_HEIGHT, window.innerHeight * 0.85);

      const nextX = clientX - dragInfo.current.offsetX;
      const nextY = clientY - dragInfo.current.offsetY;

      setPosition({
        x: Math.min(Math.max(16, nextX), Math.max(16, window.innerWidth - width - 16)),
        y: Math.min(Math.max(16, nextY), Math.max(16, window.innerHeight - height - 16)),
      });
    });
  };

  const endDrag = () => setIsDragging(false);

  const saveRecent = (id: string) => {
    const updated = [id, ...recentIds.filter((recentId) => recentId !== id)].slice(0, 2);
    setRecentIds(updated);
  };

  const handleFaqClick = (item: FaqItem) => {
    setOpenedId((prev) => (prev === item.id ? null : item.id));
    saveRecent(item.id);
  };

  const handleRecentClick = (item: FaqItem) => {
    setSearch("");
    setSelectedCategory("전체");
    setHasCategoryClicked(true);
    setOpenedId(item.id);
    saveRecent(item.id);
  };

  const handleSearchHintClick = (keyword: string) => {
    setSearch(keyword);
    setSelectedCategory("전체");
    setHasCategoryClicked(false);
    setOpenedId(null);
  };

  const openExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const categoryList = useMemo(() => {
    const unique = Array.from(new Set(faqList.map((item) => item.category)));
    const ordered = CATEGORY_ORDER.filter((category) => category === "전체" || unique.includes(category));
    const extra = unique.filter((category) => !CATEGORY_ORDER.includes(category));
    return [...ordered, ...extra];
  }, [faqList]);

  const searchKeywords = useMemo(() => getSearchKeywords(search), [search]);

  const filteredFaqList = useMemo(() => {
    return faqList.filter((item) => {
      const categoryMatched = selectedCategory === "전체" || item.category === selectedCategory;
      const searchableText = normalizeText(
        `${item.category} ${item.subCategory} ${item.question} ${getFixedAnswer(item)}`
      );
      const searchMatched =
        search.trim() === "" || searchKeywords.some((keyword) => searchableText.includes(keyword));

      return categoryMatched && searchMatched;
    });
  }, [faqList, selectedCategory, search, searchKeywords]);

  const recentFaqList = useMemo(() => {
    return recentIds
      .map((id) => faqList.find((item) => item.id === id))
      .filter(Boolean)
      .slice(0, 2) as FaqItem[];
  }, [recentIds, faqList]);

  if (!mounted) return null;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="FAQ 닫기"
          onClick={closeWidget}
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]"
        />
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={openWidget}
          style={
            isMobile
              ? {
                  bottom: "20px",
                  right: "20px",
                }
              : {
                  bottom: "48px",
                  right: "80px",
                }
          }
          className="fixed z-50 w-[90px] h-[112px] rounded-[32px] bg-gradient-to-b from-[#FFF4B8] to-[#FFE66D] border border-[#F3D86A] shadow-[0_16px_38px_rgba(80,60,20,0.18)] flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_rgba(80,60,20,0.22)] active:scale-95"
        >
          <div className="w-[60px] h-[60px] rounded-full bg-white border border-[#F6E8B6] shadow-[inset_0_2px_0_rgba(255,255,255,0.9),0_7px_16px_rgba(120,90,20,0.12)] flex items-center justify-center mb-2">
            <img src="/diki-character.png" alt="디키캠프 문의" className="w-[44px] h-[44px] object-contain" />
          </div>
          <span className="text-[12.5px] font-extrabold text-[#222] leading-tight tracking-[-0.02em]">
            디키캠프
          </span>
          <span className="text-[12.5px] font-extrabold text-[#222] leading-tight tracking-[-0.02em]">
            문의
          </span>
        </button>
      )}

      <section
        data-faq-popup="true"
        className={`fixed z-50 bg-[#FFFDF8] border border-[#F3D86A] shadow-[0_24px_80px_rgba(0,0,0,0.24)] overflow-hidden flex flex-col select-none ${
          isDragging ? "transition-none" : "transition-[opacity,transform] duration-300"
        } ${
          isMobile
            ? `left-0 bottom-0 w-full h-[88vh] rounded-t-[32px] ${
                isOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
              }`
            : `rounded-[34px] ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`
        }`}
        style={
          isMobile
            ? undefined
            : {
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${POPUP_WIDTH}px`,
                height: `min(${POPUP_HEIGHT}px, 85vh)`,
              }
        }
      >
        <div
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`shrink-0 bg-white border-b border-[#F3D86A] px-6 pt-3 pb-4 ${
            isMobile ? "" : "cursor-grab active:cursor-grabbing"
          }`}
        >
          {!isMobile && (
            <div className="flex justify-center mb-2">
              <div className="w-12 h-1.5 rounded-full bg-[#E6D6A7]" />
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-extrabold text-[#FF9F43] mb-1">Diki Camp Help</p>
              <h2 className="text-[23px] font-extrabold text-[#111] tracking-[-0.03em]">디키캠프 FAQ</h2>
              <p className="text-[12px] text-[#777] mt-0.5">빠르게 답변을 확인해보세요</p>
            </div>

            <button
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={closeWidget}
              className="w-10 h-10 rounded-full bg-[#FFF8E3] text-[22px] text-[#777] leading-none flex items-center justify-center hover:bg-[#FFF1A6]"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 select-text">
          <div className="bg-white rounded-[22px] border border-[#F3D86A] px-4 py-3 mb-3 shadow-[0_8px_22px_rgba(120,90,20,0.05)]">
            <div className="flex items-center gap-3">
              <div className="w-[40px] h-[40px] rounded-[15px] bg-[#FFF1A6] flex items-center justify-center shrink-0">
                <img src="/diki-character.png" alt="디키캠프 캐릭터" className="w-[27px] h-[27px] object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-extrabold leading-[1.35] text-[#222]">안녕하세요. 디키캠프 FAQ입니다.</p>
                <p className="text-[11.5px] text-[#777] leading-[1.45] mt-1">검색하거나 카테고리를 선택해 답변을 확인해보세요.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#F3D86A] px-4 py-3 flex items-center gap-2.5 mb-3 shadow-[0_6px_18px_rgba(120,90,20,0.04)]">
            <span className="text-[17px]">🔎</span>
            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setOpenedId(null);
                setHasCategoryClicked(false);
                setSelectedCategory("전체");
              }}
              placeholder="비용, 참가비, 일정 등을 검색해보세요"
              className="w-full bg-transparent outline-none text-[14px] text-[#222] placeholder:text-[#b7b0a5]"
            />
          </div>

          {!shouldShowFaqList && (
            <div className="mb-3">
              <p className="text-[13px] font-bold text-[#555] mb-2">최근 검색 질문</p>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {recentFaqList.length > 0
                  ? recentFaqList.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleRecentClick(item)}
                        className="shrink-0 max-w-[260px] px-4 py-2 rounded-full bg-[#FFF7F0] border border-[#FFD7B0] text-[12.5px] font-semibold text-[#7A4A1E] truncate hover:bg-[#FFF1E3]"
                      >
                        {item.question}
                      </button>
                    ))
                  : DEFAULT_SEARCH_HINTS.map((keyword) => (
                      <button
                        type="button"
                        key={keyword}
                        onClick={() => handleSearchHintClick(keyword)}
                        className="shrink-0 max-w-[260px] px-4 py-2 rounded-full bg-[#FFF7F0] border border-[#FFD7B0] text-[12.5px] font-semibold text-[#7A4A1E] truncate hover:bg-[#FFF1E3]"
                      >
                        {keyword}
                      </button>
                    ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {categoryList.map((category) => {
              const isActive = selectedCategory === category && hasCategoryClicked;

              return (
                <button
                  type="button"
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setHasCategoryClicked(true);
                    setSearch("");
                    setOpenedId(null);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-[13px] font-bold border transition-all ${
                    isActive
                      ? "bg-[#FFE66D] border-[#DDBB25] text-[#111] shadow-[0_7px_16px_rgba(255,215,64,0.36)]"
                      : "bg-white border-[#F3D86A] text-[#5B5346] shadow-[0_4px_12px_rgba(80,60,20,0.04)] hover:border-[#E8C83F] hover:bg-[#FFF9E6]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          {isLoading && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 w-8 h-8 rounded-full border-4 border-[#FFE66D] border-t-transparent animate-spin" />
              <p className="text-[14px] text-[#888]">FAQ를 불러오는 중입니다.</p>
            </div>
          )}

          {!isLoading && !loadError && !shouldShowFaqList && (
            <div className="bg-white rounded-[24px] border border-[#F3D86A] p-6 text-center">
              <p className="text-[16px] font-extrabold text-[#333] mb-2">궁금한 내용을 찾아보세요.</p>
              <p className="text-[13px] text-[#888] leading-[1.7]">
                검색창에 키워드를 입력하거나
                <br />
                카테고리를 선택하면 FAQ가 표시됩니다.
              </p>
            </div>
          )}

          {!isLoading && loadError && (
            <div className="bg-white rounded-[24px] border border-[#F3D86A] p-6 text-center">
              <p className="text-[15px] font-bold text-[#333] mb-2">데이터를 불러오지 못했어요.</p>
              <p className="text-[13px] text-[#888]">Apps Script API 연결 상태를 확인해주세요.</p>
            </div>
          )}

          {!isLoading && !loadError && shouldShowFaqList && filteredFaqList.length === 0 && (
            <div className="bg-white rounded-[24px] border border-[#F3D86A] p-7 text-center">
              <p className="text-[16px] font-bold text-[#333] mb-2">검색 결과가 없습니다.</p>
              <p className="text-[13px] text-[#888] leading-[1.6]">
                다른 단어로 검색하거나
                <br />
                문의 남기기를 이용해주세요.
              </p>
            </div>
          )}

          {!isLoading && !loadError && shouldShowFaqList && filteredFaqList.length > 0 && (
            <div className="space-y-3 pb-3">
              {filteredFaqList.map((item) => {
                const isOpened = openedId === item.id;
                const label = item.subCategory || item.category;
                const isReservationAlert = isReservationAlertItem(item);
                const displayAnswer = getFixedAnswer(item);

                return (
                  <article
                    key={item.id}
                    className="bg-white border border-[#F3D86A] rounded-[24px] overflow-hidden shadow-[0_8px_22px_rgba(120,90,20,0.05)]"
                  >
                    <button type="button" onClick={() => handleFaqClick(item)} className="w-full text-left p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          {label && <p className="text-[12px] font-bold text-[#FF9F43] mb-1.5">{label}</p>}
                          <h3 className="text-[16px] font-extrabold text-[#222] leading-[1.5] tracking-[-0.02em]">
                            {item.question}
                          </h3>
                        </div>
                        <span
                          className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[21px] font-light transition-all ${
                            isOpened ? "bg-[#FFF1A6] text-[#222]" : "bg-[#FFF8E3] text-[#888]"
                          }`}
                        >
                          {isOpened ? "−" : "+"}
                        </span>
                      </div>
                    </button>

                    {isOpened && (
                      <div className="px-4 pb-4">
                        <div className="border-t border-[#F3D86A] pt-3">
                          {isReservationAlert ? (
                            <div>
                              <div className="text-[14.5px] leading-[1.8] text-[#555] mb-4">
                                {renderAnswerText(displayAnswer)}
                              </div>

                              <div className="grid grid-cols-1 gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => openExternalLink(EARLY_BIRD_FORM_URL)}
                                  className="w-full rounded-[18px] bg-[#FFF1A6] border border-[#E8C83F] px-4 py-3 text-[14px] font-extrabold text-[#222] shadow-[0_6px_16px_rgba(255,230,109,0.26)] transition-all hover:brightness-[0.98] active:scale-[0.98]"
                                >
                                  얼리버드 알림 신청
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openExternalLink(BENEFIT_FORM_URL)}
                                  className="w-full rounded-[18px] bg-[#FFF8E3] border border-[#E8C83F] px-4 py-3 text-[14px] font-extrabold text-[#5B4324] shadow-[0_6px_16px_rgba(120,80,20,0.08)] transition-all hover:bg-[#FFF3CF] active:scale-[0.98]"
                                >
                                  특별 혜택가 알림 신청
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[14.5px] leading-[1.8] text-[#555]">
                              {renderAnswerText(displayAnswer)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 px-5 py-2.5 bg-white border-t border-[#F3D86A]">
          <button
            type="button"
            onClick={() => openExternalLink(GOOGLE_FORM_URL)}
            className="w-full h-[38px] rounded-full bg-[#FFE66D] text-[#111] text-[14px] font-extrabold shadow-[0_4px_10px_rgba(255,230,109,0.26)] transition-all hover:brightness-[0.98] active:scale-[0.98]"
          >
            문의 남기기
          </button>
        </div>
      </section>
    </>
  );
}