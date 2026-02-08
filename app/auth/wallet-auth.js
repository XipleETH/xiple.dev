"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

const BASE_CHAIN_ID = 8453;
const BASE_CHAIN_HEX = "0x2105";

function getInjectedEvmProviders() {
  if (typeof window === "undefined") {
    return [];
  }

  const injected = window.ethereum;
  if (!injected) {
    return [];
  }

  if (Array.isArray(injected.providers) && injected.providers.length > 0) {
    return injected.providers;
  }

  return [injected];
}

function isTrustWallet(provider) {
  return Boolean(provider?.isTrust || provider?.isTrustWallet);
}

function isMetaMask(provider) {
  return Boolean(provider?.isMetaMask) && !isTrustWallet(provider);
}

function getEvmProvider(wallet) {
  const providers = getInjectedEvmProviders();
  if (providers.length === 0) {
    return null;
  }

  if (wallet === "base") {
    return providers.find((provider) => provider?.isCoinbaseWallet) || providers[0];
  }

  if (wallet === "metamask") {
    return providers.find((provider) => isMetaMask(provider)) || null;
  }

  if (wallet === "trustwallet") {
    return providers.find((provider) => isTrustWallet(provider)) || null;
  }

  return providers[0];
}

function getPhantomProvider() {
  if (typeof window === "undefined") {
    return null;
  }

  const provider = window?.phantom?.solana || window?.solana;
  if (!provider || !provider.isPhantom) {
    return null;
  }

  return provider;
}

async function ensureBaseChain(provider) {
  if (!provider?.request) {
    return;
  }

  const currentChainId = await provider.request({ method: "eth_chainId" });
  if (String(currentChainId).toLowerCase() === BASE_CHAIN_HEX) {
    return;
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BASE_CHAIN_HEX }]
    });
  } catch (error) {
    if (error?.code !== 4902) {
      throw error;
    }

    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: BASE_CHAIN_HEX,
          chainName: "Base",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18
          },
          rpcUrls: ["https://mainnet.base.org"],
          blockExplorerUrls: ["https://basescan.org"]
        }
      ]
    });
  }
}

function parseError(error) {
  const text = String(error?.message || error || "").trim();
  if (!text) {
    return "Could not connect the wallet.";
  }

  if (text.includes("provider is not enabled")) {
    return "Enable Web3 auth provider in Supabase (Ethereum and Solana).";
  }

  return text;
}

const WALLET_BUTTONS = [
  { id: "base", label: "Base", mark: "B", type: "evm" },
  { id: "metamask", label: "MetaMask", mark: "M", type: "evm" },
  { id: "trustwallet", label: "Trust Wallet", mark: "T", type: "evm" },
  { id: "phantom", label: "Phantom", mark: "P", type: "solana" }
];

export default function WalletAuth({
  initialMessage,
  initialError,
  redirectTo = "/",
  embedded = false
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pendingWallet, setPendingWallet] = useState("");
  const [message, setMessage] = useState(initialMessage || "");
  const [error, setError] = useState(initialError || "");

  async function signInWithEvm(walletId) {
    const provider = getEvmProvider(walletId);
    if (!provider) {
      throw new Error(`Wallet not detected: ${walletId}`);
    }

    if (walletId === "base") {
      await ensureBaseChain(provider);
    }

    const { error: authError } = await supabase.auth.signInWithWeb3({
      chain: "ethereum",
      wallet: provider,
      statement: "Sign in to hubfol.io",
      options: walletId === "base" ? { signInWithEthereum: { chainId: BASE_CHAIN_ID } } : undefined
    });

    if (authError) {
      throw authError;
    }
  }

  async function signInWithSolana() {
    const provider = getPhantomProvider();
    if (!provider) {
      throw new Error("Wallet not detected: phantom");
    }

    const { error: authError } = await supabase.auth.signInWithWeb3({
      chain: "solana",
      wallet: provider,
      statement: "Sign in to hubfol.io"
    });

    if (authError) {
      throw authError;
    }
  }

  async function resolveRedirectPath() {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        const username = String(profile?.username || "").trim();
        if (username) {
          return `/${username}`;
        }
        return redirectTo;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return redirectTo;
  }

  async function connectWallet(walletId, type) {
    setPendingWallet(walletId);
    setError("");
    setMessage("");

    try {
      if (type === "solana") {
        await signInWithSolana();
      } else {
        await signInWithEvm(walletId);
      }

      const nextPath = await resolveRedirectPath();
      router.replace(nextPath);
      router.refresh();
    } catch (authError) {
      setError(parseError(authError));
    } finally {
      setPendingWallet("");
    }
  }

  const content = (
    <section className="card" style={{ padding: "18px" }}>
      <p className="kicker">Wallet</p>
      <h1 className="page-title" style={{ fontSize: "1.8rem", marginTop: "6px" }}>
        Connect wallet
      </h1>
      <p className="page-sub">Use Base, MetaMask, Trust Wallet or Phantom to edit your profile.</p>

      {message ? <p className="notice ok">{message}</p> : null}
      {error ? <p className="notice err">{error}</p> : null}

      <div className="stack" style={{ marginTop: "12px" }}>
        {WALLET_BUTTONS.map((wallet) => (
          <button
            key={wallet.id}
            className="btn wallet-btn"
            type="button"
            disabled={Boolean(pendingWallet)}
            onClick={() => connectWallet(wallet.id, wallet.type)}
          >
            <span className="wallet-mark" aria-hidden="true">
              {wallet.mark}
            </span>
            <span>{pendingWallet === wallet.id ? "Connecting..." : `Continue with ${wallet.label}`}</span>
          </button>
        ))}
      </div>

      <p className="help" style={{ marginTop: "10px" }}>
        If a wallet is not installed, that button will fail until the extension/app is available.
      </p>
    </section>
  );

  if (embedded) {
    return content;
  }

  return <main className="container stack" style={{ maxWidth: "560px" }}>{content}</main>;
}
