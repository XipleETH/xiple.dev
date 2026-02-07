import WalletAuth from "@/app/auth/wallet-auth";

export default async function AuthPage({ searchParams }) {
  const params = await searchParams;
  const message = params?.message;
  const error = params?.error;

  return <WalletAuth initialMessage={message} initialError={error} />;
}
