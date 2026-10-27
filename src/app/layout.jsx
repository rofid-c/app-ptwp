import "./globals.css";

export const metadata = {
  title: "PTWP-Hub | Pengadilan Agama Gunung Sugih",
  description: "Sistem Informasi Terpadu, Rekapitulasi Iuran, dan Kas PTWP Cabang Pengadilan Agama Gunung Sugih",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎾</text></svg>" />
      </head>
      <body>{children}</body>
    </html>
  );
}
