import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'pulse-forge',
  description: 'Feature flag & analytics platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}
