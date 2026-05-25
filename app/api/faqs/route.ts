import { NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyvhqZGiieK61MZXmH3La52_L_re4m2DtuWCnFmlfTrPO4kAiZwWlmSzj-aFpIT2LWS/exec";

export const dynamic = "force-dynamic";

function getText(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function isVisible(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (value === true) return true;
  if (typeof value === "string") {
    return ["true", "TRUE", "Y", "y", "노출", "공개", "1"].includes(value.trim());
  }
  if (typeof value === "number") return value === 1;
  return false;
}

function hasContact(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === "string") {
    return ["true", "TRUE", "Y", "y", "문의", "유도", "1"].includes(value.trim());
  }
  if (typeof value === "number") return value === 1;
  return false;
}

export async function GET() {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getFaqs`, {
      method: "GET",
      redirect: "follow",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Google Apps Script 응답 실패: ${response.status}`);
    }

    const text = await response.text();

    let rawData: unknown;
    try {
      rawData = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { success: false, message: "JSON 파싱 실패", items: [] },
        { status: 500 }
      );
    }

    const items: Record<string, unknown>[] = Array.isArray(rawData)
      ? rawData
      : Array.isArray((rawData as Record<string, unknown>)?.items)
      ? (rawData as Record<string, unknown>).items as Record<string, unknown>[]
      : [];

    const normalized = items
      .filter((item) => {
        const question = getText(item, ["질문", "question", "Question"]);
        const answer   = getText(item, ["답변", "answer",   "Answer"]);
        const visible  = item["노출여부"] ?? item.visible ?? item.show ?? true;
        return isVisible(visible) && question && answer;
      })
      .map((item, index) => {
        const mainCategory =
          getText(item, ["대분류", "mainCategory", "category", "카테고리"]) ||
          "자주 묻는 질문";
        const subCategory = getText(item, ["중분류", "subCategory", "subcategory"]);
        return {
          id:           getText(item, ["id", "ID"]) || String(index + 1),
          mainCategory,
          subCategory,
          question:     getText(item, ["질문", "question", "Question"]),
          answer:       getText(item, ["답변", "answer",   "Answer"]),
          visible:      true,
          sortOrder:    Number(item["정렬순서"] ?? item.sortOrder ?? index + 1),
          contact:      hasContact(item["문의유도"] ?? item.contact ?? false),
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return NextResponse.json({
      success: true,
      count:   normalized.length,
      items:   normalized,
    });

  } catch (error) {
    console.error("[FAQ API Error]", error);
    return NextResponse.json(
      { success: false, message: "FAQ 데이터를 불러오지 못했습니다.", items: [] },
      { status: 500 }
    );
  }
}