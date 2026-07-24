import "./globals.css";
import Header from "../components/Header";
import QueryProvider from "../providers/QueryProvider";
import AuthProvider from "../providers/AuthProvider";
import StripeProvider from "../providers/StripeProvider";
import { CartDrawer } from "../components/CartDrawer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            <StripeProvider>
              <Header />
              <CartDrawer />
              {children}
            </StripeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}