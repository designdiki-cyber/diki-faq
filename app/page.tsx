import FaqWidget from "./components/faq/FaqWidget";

export default function Home() {
  return (
    // 배경 투명 — 홈페이지에 올렸을 때 홈페이지 배경이 그대로 보임
    <main style={{ background: "transparent" }}>
      <FaqWidget />
    </main>
  );
}