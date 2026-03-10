export const metadata = {
  title: "HR AI Ассистент",
  description: "Умный помощник рекрутера",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, padding: 0, background: "#07070f" }}>
        {children}
      </body>
    </html>
  );
}
