import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a visit | Dvora Hub",
  description:
    "Book therapy and wellness services as a guest — no account required.",
};

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
