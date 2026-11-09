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
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-ptwp.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
