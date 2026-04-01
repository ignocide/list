import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nook',
  description: '나만의 아늑한 메모 공간',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
