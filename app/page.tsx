"use client";

import FaqWidget from "./components/faq/FaqWidget";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFFDF6] text-[#333333]">
      {/* 홈페이지 내용 */}
      <section className="p-10">
        <h1 className="text-3xl font-bold">
          디키캠프 홈페이지
        </h1>

        <p className="mt-4 text-base text-gray-600">
          디키캠프 FAQ 위젯 연결 테스트 화면입니다.
        </p>
      </section>

      {/* FAQ 위젯 */}
      <FaqWidget />
    </main>
  );
}