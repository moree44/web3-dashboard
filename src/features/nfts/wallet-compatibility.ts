const EVM_CHAINS = new Set([
  "evm",
  "ethereum",
  "eth",
  "base",
  "arbitrum",
  "arbitrum one",
  "optimism",
  "op mainnet",
  "polygon",
  "matic",
  "avalanche",
  "avalanche c-chain",
  "bsc",
  "bnb chain",
  "zksync",
  "zksync era",
  "linea",
  "scroll",
  "mantle",
  "blast",
]);

const NON_EVM_CHAINS = new Set([
  "solana",
  "sui",
  "aptos",
  "bitcoin",
  "btc",
  "cosmos",
  "near",
  "ton",
  "cardano",
  "tron",
  "starknet",
]);

function normalizeChain(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ") ?? "";
}

export function areWalletAndCampaignChainsCompatible(
  walletChain: string | null | undefined,
  campaignChain: string,
) {
  const wallet = normalizeChain(walletChain);
  const campaign = normalizeChain(campaignChain);
  if (!wallet || !campaign) return false;
  if (wallet === campaign) return true;
  if (EVM_CHAINS.has(wallet) && !NON_EVM_CHAINS.has(campaign)) return true;
  if (EVM_CHAINS.has(campaign) && !NON_EVM_CHAINS.has(wallet)) return true;
  return false;
}
