import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Push Push',
  description: '80-90년대 레트로 감성과 정통 푸시푸시(소코반) 1칸 이동 룰이 결합된 웹 기반 퍼즐 게임',
  keywords: ['푸시푸시', '소코반', 'PushPush', 'Sokoban', '퍼즐게임', 'Next.js', 'Supabase'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="bg-[#0a0b10] text-[#ededed] antialiased min-h-screen selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
