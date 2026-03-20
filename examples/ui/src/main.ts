import "./styles.css";

import { ethers } from "ethers";
import {
  PrmissionClient,
  PrmissionNetwork,
  isOk,
  parseUsdc,
  type PrmissionClientConfig,
  type PrmissionError,
  type PrmissionWriteClient,
  type Result,
} from "prmission-sdk";

declare global {
  interface Window {
    ethereum?: unknown;
  }
}

type StatusKind = "good" | "warn" | "bad";

let client: PrmissionClient | null = null;
let writer: PrmissionWriteClient | null = null;
let walletAddress: string | null = null;

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el as T;
}

const els = {
  network: () => byId<HTMLSelectElement>("network"),
  rpcUrl: () => byId<HTMLInputElement>("rpcUrl"),
  contractAddress: () => byId<HTMLInputElement>("contractAddress"),
  chainId: () => byId<HTMLInputElement>("chainId"),

  createClient: () => byId<HTMLButtonElement>("createClient"),
  resetClient: () => byId<HTMLButtonElement>("resetClient"),
  clientInfo: () => byId<HTMLDivElement>("clientInfo"),

  connectWallet: () => byId<HTMLButtonElement>("connectWallet"),
  disconnectWallet: () => byId<HTMLButtonElement>("disconnectWallet"),
  switchBase: () => byId<HTMLButtonElement>("switchBase"),
  walletInfo: () => byId<HTMLDivElement>("walletInfo"),
  scanLinks: () => byId<HTMLDivElement>("scanLinks"),

  toggleAdvanced: () => byId<HTMLButtonElement>("toggleAdvanced"),

  sDataCategory: () => byId<HTMLInputElement>("sDataCategory"),
  sPurpose: () => byId<HTMLInputElement>("sPurpose"),
  sSharePercent: () => byId<HTMLInputElement>("sSharePercent"),
  sEscrowUsdc: () => byId<HTMLInputElement>("sEscrowUsdc"),
  sCreatePermission: () => byId<HTMLButtonElement>("sCreatePermission"),
  sDepositEscrow: () => byId<HTMLButtonElement>("sDepositEscrow"),
	  sReportOutcome: () => byId<HTMLButtonElement>("sReportOutcome"),
	  sPreviewSettlement: () => byId<HTMLButtonElement>("sPreviewSettlement"),
	  sSettle: () => byId<HTMLButtonElement>("sSettle"),
	  sDemoSettle: () => byId<HTMLButtonElement>("sDemoSettle"),
	  sIds: () => byId<HTMLDivElement>("sIds"),
	  simpleNarrative: () => byId<HTMLDivElement>("simpleNarrative"),

  permissionId: () => byId<HTMLInputElement>("permissionId"),
  escrowId: () => byId<HTMLInputElement>("escrowId"),
  userAddress: () => byId<HTMLInputElement>("userAddress"),
  agentAddress: () => byId<HTMLInputElement>("agentAddress"),
  agentId: () => byId<HTMLInputElement>("agentId"),
  balanceAddress: () => byId<HTMLInputElement>("balanceAddress"),

  wMerchant: () => byId<HTMLInputElement>("wMerchant"),
  wDataCategory: () => byId<HTMLInputElement>("wDataCategory"),
  wPurpose: () => byId<HTMLInputElement>("wPurpose"),
  wCompBps: () => byId<HTMLInputElement>("wCompBps"),
  wUpfrontFee: () => byId<HTMLInputElement>("wUpfrontFee"),
  wValidity: () => byId<HTMLInputElement>("wValidity"),
  wPermissionId: () => byId<HTMLInputElement>("wPermissionId"),
  wEscrowAmount: () => byId<HTMLInputElement>("wEscrowAmount"),
  wAgentId: () => byId<HTMLInputElement>("wAgentId"),
  wEscrowId: () => byId<HTMLInputElement>("wEscrowId"),
  wOutcomeValue: () => byId<HTMLInputElement>("wOutcomeValue"),
  wOutcomeType: () => byId<HTMLInputElement>("wOutcomeType"),
  wOutcomeDesc: () => byId<HTMLInputElement>("wOutcomeDesc"),
  wSettleEscrowId: () => byId<HTMLInputElement>("wSettleEscrowId"),
  wDisputeReason: () => byId<HTMLInputElement>("wDisputeReason"),
  wAdminPermissionId: () => byId<HTMLInputElement>("wAdminPermissionId"),
  wAllowanceAmount: () => byId<HTMLInputElement>("wAllowanceAmount"),

  status: () => byId<HTMLDivElement>("status"),
  output: () => byId<HTMLPreElement>("output"),
};

let busy = false;
let simplePermissionId: bigint | null = null;
	let simpleEscrowId: bigint | null = null;
	let simpleOutcomeReported = false;
	let simplePreviewDone = false;
	let simpleSettled = false;
	let simpleDemoSettled = false;

function setStatus(text: string, kind?: StatusKind) {
  const el = els.status();
  el.textContent = text;
  el.classList.remove("good", "warn", "bad");
  if (kind) el.classList.add(kind);
}

function setOutput(value: unknown) {
  els.output().textContent = safeJson(value);
}

function setNarrative(lines: string[]) {
  const el = els.simpleNarrative();
  el.innerHTML = "";
  for (const line of lines) {
    const p = document.createElement("p");
    p.textContent = line;
    p.style.margin = "8px 0";
    el.appendChild(p);
  }
}

function updateSimpleIds() {
  const p = simplePermissionId ? simplePermissionId.toString() : "(none)";
  const e = simpleEscrowId ? simpleEscrowId.toString() : "(none)";
  els.sIds().textContent = `Permission: ${p} | Escrow: ${e}`;
}

function updateSimpleControls() {
  const connected = writer !== null;
  const hasPermission = simplePermissionId !== null;
  const hasEscrow = simpleEscrowId !== null;

  els.connectWallet().disabled = busy || connected;
  els.disconnectWallet().disabled = busy || !connected;

  els.sCreatePermission().disabled = busy || !connected || hasPermission;
  els.sDepositEscrow().disabled = busy || !connected || !hasPermission || hasEscrow;
  els.sReportOutcome().disabled =
    busy || !connected || !hasEscrow || simpleOutcomeReported;
  els.sPreviewSettlement().disabled =
    busy || !hasEscrow || !simpleOutcomeReported || simplePreviewDone;
  els.sSettle().disabled =
    busy || !connected || !hasEscrow || !simpleOutcomeReported || simpleSettled;
  els.sDemoSettle().disabled =
    busy ||
    !hasEscrow ||
    !simpleOutcomeReported ||
    simpleSettled ||
    simpleDemoSettled;
}

function setBusy(next: boolean) {
  busy = next;
  const buttons = Array.from(document.querySelectorAll("button"));
  for (const btn of buttons) {
    btn.disabled = busy;
  }
  updateSimpleControls();
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      (_k, v) => (typeof v === "bigint" ? v.toString() : v),
      2
    );
  } catch {
    return String(value);
  }
}

function explorerBaseUrl(network: PrmissionNetwork): string | null {
  if (network === PrmissionNetwork.BaseMainnet) return "https://basescan.org";
  if (network === PrmissionNetwork.BaseSepolia) return "https://sepolia.basescan.org";
  return null;
}

function updateInfoPanels() {
  if (!client) {
    els.clientInfo().textContent = "No client created.";
  } else {
    const chain = client.chainId ? ` (chainId ${client.chainId})` : "";
    els.clientInfo().textContent = `${client.network}${chain} | ${client.contractAddress}`;
  }

  if (!walletAddress) {
    els.walletInfo().textContent = "No wallet connected.";
  } else {
    els.walletInfo().textContent = `Connected: ${walletAddress}`;
  }

  const linksEl = els.scanLinks();
  linksEl.innerHTML = "";
  if (!client) {
    updateSimpleControls();
    return;
  }

  const base = explorerBaseUrl(client.network);
  if (!base) {
    updateSimpleControls();
    return;
  }

  const links: Array<{ href: string; label: string }> = [
    { href: `${base}/address/${client.contractAddress}`, label: "Contract" },
  ];
  if (walletAddress) {
    links.push({ href: `${base}/address/${walletAddress}`, label: "Wallet" });
  }

  for (const link of links) {
    const a = document.createElement("a");
    a.href = link.href;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = `${link.label} on BaseScan`;
    linksEl.appendChild(a);
  }

  updateSimpleControls();
}

function parseOptionalInput(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function parseBigint(name: string, value: string): bigint {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${name} is required`);
  try {
    return BigInt(trimmed);
  } catch {
    throw new Error(`Invalid ${name}: ${value}`);
  }
}

function parseAddress(name: string, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${name} is required`);
  if (!ethers.isAddress(trimmed)) throw new Error(`Invalid ${name}: ${trimmed}`);
  return ethers.getAddress(trimmed);
}

function parseNumber(name: string, value: string): number {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${name} is required`);
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${name}: ${value}`);
  return parsed;
}

function getNetwork(): PrmissionNetwork {
  const value = els.network().value;
  if (value === "base-mainnet") return PrmissionNetwork.BaseMainnet;
  if (value === "base-sepolia") return PrmissionNetwork.BaseSepolia;
  return PrmissionNetwork.Custom;
}

function createClientFromInputs(): Result<PrmissionClient, PrmissionError> {
  const network = getNetwork();
  const rpcUrl = parseOptionalInput(els.rpcUrl().value);
  const contractAddress = parseOptionalInput(els.contractAddress().value);
  const chainIdValue = parseOptionalInput(els.chainId().value);
  const chainId = chainIdValue ? parseNumber("chainId", chainIdValue) : undefined;

  const config: PrmissionClientConfig =
    network === PrmissionNetwork.BaseMainnet
      ? { network, rpcUrl, contractAddress }
      : network === PrmissionNetwork.BaseSepolia
        ? {
            network,
            rpcUrl,
            contractAddress: contractAddress ?? "",
          }
        : {
            network,
            rpcUrl: rpcUrl ?? "",
            contractAddress: contractAddress ?? "",
            chainId,
          };

  return PrmissionClient.create(config);
}

async function connectWallet() {
  if (!window.ethereum) {
    setStatus("No injected wallet found (install MetaMask).", "bad");
    return;
  }

  if (!client) {
    setStatus("Create a client first.", "warn");
    return;
  }

  setBusy(true);
  try {
    setStatus("Connecting wallet...");
    const provider = new ethers.BrowserProvider(window.ethereum as any);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    walletAddress = await signer.getAddress();

    const network = await provider.getNetwork();
    if (client.chainId && BigInt(client.chainId) !== network.chainId) {
      setStatus(
        `Wallet chainId ${network.chainId.toString()} does not match client chainId ${client.chainId}.`,
        "warn"
      );
    } else {
      setStatus("Wallet connected.", "good");
    }

    writer = client.withSigner(signer);
    updateInfoPanels();
    setOutput({ wallet: walletAddress, chainId: network.chainId.toString() });
  } finally {
    setBusy(false);
  }
}

function disconnectWallet() {
  writer = null;
  walletAddress = null;
  setStatus("Disconnected (app only).", "good");
  setOutput({
    disconnected: true,
    note: "To fully disconnect, remove this site from your wallet's connected sites list.",
  });
  setNarrative([
    "Disconnected inside this app.",
    "Your wallet extension may still show this site as connected; remove it in the wallet UI if you want a full disconnect.",
  ]);
  updateInfoPanels();
}

async function switchWalletNetwork() {
  if (!window.ethereum) {
    setStatus("No injected wallet found.", "bad");
    return;
  }

  const network = getNetwork();
  if (network === PrmissionNetwork.Custom) {
    setStatus("Switching is only supported for Base mainnet/sepolia.", "warn");
    return;
  }

  const baseRpc =
    parseOptionalInput(els.rpcUrl().value) ??
    (network === PrmissionNetwork.BaseMainnet
      ? "https://mainnet.base.org"
      : "https://sepolia.base.org");

  const chainIdDec = network === PrmissionNetwork.BaseMainnet ? 8453 : 84532;
  const chainIdHex = `0x${chainIdDec.toString(16)}`;
  const explorer = explorerBaseUrl(network) ?? "https://basescan.org";

  try {
    setStatus("Requesting wallet network switch...");
    await (window.ethereum as any).request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    setStatus("Wallet network switched.", "good");
  } catch (err: any) {
    // 4902 = chain not added
    if (err && typeof err === "object" && err.code === 4902) {
      setStatus("Adding network to wallet...");
      await (window.ethereum as any).request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName:
              network === PrmissionNetwork.BaseMainnet ? "Base Mainnet" : "Base Sepolia",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [baseRpc],
            blockExplorerUrls: [explorer],
          },
        ],
      });
      setStatus("Network added. Try Connect Wallet again.", "good");
    } else {
      setStatus("Wallet switch failed.", "bad");
      setOutput(err);
    }
  }
}

function ensureWriteClient(): PrmissionWriteClient | null {
  if (!client) {
    setStatus("Client not ready. Reload the page.", "bad");
    return null;
  }
  if (!writer) {
    setStatus("Connect your wallet first (Step 1).", "warn");
    return null;
  }
  return writer;
}

function sharePercentToBps(percent: number): number {
  const clamped = Math.max(0, Math.min(50, percent));
  return Math.round(clamped * 100);
}

async function simpleCreatePermission() {
  const w = ensureWriteClient();
  if (!w) return;

  const dataCategory = els.sDataCategory().value.trim() || "browsing";
  const purpose = els.sPurpose().value.trim() || "consented data access";
  const percent = parseNumber("Your share (%)", els.sSharePercent().value);
  const compensationBps = sharePercentToBps(percent);

  setBusy(true);
  try {
    setStatus("Creating permission (this is your on-chain consent)...", "warn");
    setNarrative([
      "You are creating a permission. This is your on-chain 'yes'.",
      "In a real product, the user does this and the agent is a different wallet.",
    ]);

    const result = await w.grantPermission({
      dataCategory,
      purpose,
      compensationBps,
      validityPeriod: 86_400,
    });

    setOutput(result);
    if (!result.ok) {
      setStatus("Permission failed.", "bad");
      return;
    }

    simplePermissionId = result.value;
    simpleEscrowId = null;
    simpleOutcomeReported = false;
    simplePreviewDone = false;
    simpleSettled = false;
    simpleDemoSettled = false;
    els.permissionId().value = result.value.toString();
    els.wPermissionId().value = result.value.toString();
    els.wAdminPermissionId().value = result.value.toString();
    updateSimpleIds();
    updateSimpleControls();

    setStatus("Permission created.", "good");
    setNarrative([
      `Permission created (ID ${result.value.toString()}).`,
      "Next: the agent will lock USDC in escrow.",
    ]);
  } finally {
    setBusy(false);
  }
}

async function simpleDepositEscrow() {
  const w = ensureWriteClient();
  if (!w) return;
  if (!simplePermissionId) {
    setStatus("Create a permission first (Step 2).", "warn");
    return;
  }

  const usdc = els.sEscrowUsdc().value.trim() || "0.01";
  const amount = parseUsdc(usdc);

  setBusy(true);
  try {
    setStatus("Depositing escrow (this locks USDC)...", "warn");
    setNarrative([
      "Escrow locks USDC so the user is protected before the agent uses data.",
      "You may see 1-2 wallet prompts (USDC approval + escrow deposit).",
    ]);

    const result = await w.depositEscrow(simplePermissionId, amount, 0n);
    setOutput(result);
    if (!result.ok) {
      setStatus("Escrow deposit failed.", "bad");
      return;
    }

    simpleEscrowId = result.value;
    simpleOutcomeReported = false;
    simplePreviewDone = false;
    simpleSettled = false;
    simpleDemoSettled = false;
    els.escrowId().value = result.value.toString();
    els.wEscrowId().value = result.value.toString();
    els.wSettleEscrowId().value = result.value.toString();
    updateSimpleIds();
    updateSimpleControls();

    setStatus("Escrow funded.", "good");
    setNarrative([
      `Escrow created (ID ${result.value.toString()}).`,
      "Next: the agent reports the outcome (what happened).",
    ]);
  } finally {
    setBusy(false);
  }
}

async function simpleReportOutcome() {
  const w = ensureWriteClient();
  if (!w) return;
  if (!simpleEscrowId) {
    setStatus("Deposit escrow first (Step 3).", "warn");
    return;
  }

  const usdc = els.sEscrowUsdc().value.trim() || "0.01";
  const value = parseUsdc(usdc);

  setBusy(true);
  try {
    setStatus("Reporting outcome...", "warn");
    setNarrative([
      "Outcome is the agent telling the contract what happened after using the data.",
      "After this, there is a dispute window before settlement.",
    ]);

    const result = await w.reportOutcome({
      escrowId: simpleEscrowId,
      outcomeValue: value,
      outcomeType: "completed",
      outcomeDescription: "simple example",
    });
    setOutput(result);
    if (!result.ok) {
      setStatus("Outcome report failed.", "bad");
      return;
    }

    simpleOutcomeReported = true;
    updateSimpleControls();
    setStatus("Outcome reported.", "good");
    setNarrative([
      "Outcome reported.",
      "Next: preview settlement to see how USDC will split (user share, protocol fee, agent refund).",
    ]);
  } finally {
    setBusy(false);
  }
}

async function simplePreviewSettlement() {
  if (!client) {
    setStatus("Client not ready.", "bad");
    return;
  }
  if (!simpleEscrowId) {
    setStatus("Create an escrow first (Step 3).", "warn");
    return;
  }

  setBusy(true);
  try {
    setStatus("Loading settlement preview...", "warn");
    const result = await client.previewSettlement(simpleEscrowId);
    setOutput(result);
    if (!result.ok) {
      setStatus("Preview failed.", "bad");
      return;
    }

    simplePreviewDone = true;
    updateSimpleControls();
    setStatus("Preview loaded.", "good");
    setNarrative([
      `Preview: user gets ${result.value.formatted.userShare} USDC; protocol fee ${result.value.formatted.protocolFee} USDC; agent refund ${result.value.formatted.agentRefund} USDC.`,
      "Settlement can only be executed after the dispute window ends (usually 24 hours).",
    ]);
  } finally {
    setBusy(false);
  }
}

async function simpleSettle() {
  const w = ensureWriteClient();
  if (!w) return;
  if (!simpleEscrowId) {
    setStatus("Create an escrow first (Step 3).", "warn");
    return;
  }

  setBusy(true);
  try {
    setStatus("Checking if escrow is settleable...", "warn");
    const escrow = await w.getEscrow(simpleEscrowId);
    if (!escrow.ok) {
      setOutput(escrow);
      setStatus("Could not load escrow.", "bad");
      return;
    }

    if (!escrow.value.isSettleable) {
      const end = Number(escrow.value.disputeWindowEnd) * 1000;
      const when = new Date(end).toLocaleString();
      setStatus("Not settleable yet.", "warn");
      setNarrative([
        "Settlement is blocked until the dispute window ends.",
        `Try again after: ${when}`,
        "If you just need a demo right now, click “Settle Now (demo, no tx)”.",
      ]);
      setOutput(escrow);
      return;
    }

    setStatus("Settling...", "warn");
    const result = await w.settle(simpleEscrowId);
    setOutput(result);
    if (!result.ok) {
      setStatus("Settlement failed.", "bad");
      return;
    }

    simpleSettled = true;
    updateSimpleControls();
    setStatus("Settled.", "good");
    setNarrative([
      "Settlement completed. USDC has been split and paid out on-chain.",
      "Check your wallet and BaseScan for the settlement event.",
    ]);
  } finally {
    setBusy(false);
  }
}

async function simpleDemoSettle() {
  if (!client) {
    setStatus("Client not ready.", "bad");
    return;
  }
  if (!simpleEscrowId) {
    setStatus("Create an escrow first (Step 3).", "warn");
    return;
  }
  if (!simpleOutcomeReported) {
    setStatus("Report outcome first (Step 4).", "warn");
    return;
  }

  setBusy(true);
  try {
    setStatus("Demo settling (no on-chain tx)...", "warn");
    const result = await client.previewSettlement(simpleEscrowId);
    setOutput(result);
    if (!result.ok) {
      setStatus("Demo settle failed.", "bad");
      return;
    }

    const end = Number(result.value.disputeWindowEnd) * 1000;
    const when = new Date(end).toLocaleString();

    simpleDemoSettled = true;
    updateSimpleControls();
    setStatus("Demo settled (no tx).", "good");
    setNarrative([
      `Demo settle: user gets ${result.value.formatted.userShare} USDC; protocol fee ${result.value.formatted.protocolFee} USDC; agent refund ${result.value.formatted.agentRefund} USDC.`,
      "No transaction was sent. This is for demo only.",
      `Real on-chain settlement becomes available after: ${when}`,
    ]);
  } finally {
    setBusy(false);
  }
}

async function runRead(op: string) {
  if (!client) {
    setStatus("Create a client first.", "warn");
    return;
  }

  try {
    setStatus(`Running ${op}...`);

    const permissionId = parseBigint("permissionId", els.permissionId().value);
    const escrowId = parseBigint("escrowId", els.escrowId().value);
    const userAddress = parseOptionalInput(els.userAddress().value);
    const agentAddress = parseOptionalInput(els.agentAddress().value);
    const agentId = parseBigint("agentId", els.agentId().value);
    const balanceAddress = parseOptionalInput(els.balanceAddress().value);

    let result: unknown;
    switch (op) {
      case "getTreasury":
        result = await client.getTreasury();
        break;
      case "getTotalProtocolFees":
        result = await client.getTotalProtocolFees();
        break;
      case "getTrustedReviewers":
        result = await client.getTrustedReviewers();
        break;
      case "isIdentityEnforced":
        result = await client.isIdentityEnforced();
        break;
      case "isReputationEnforced":
        result = await client.isReputationEnforced();
        break;
      case "getPermission":
        result = await client.getPermission(permissionId);
        break;
      case "getUserPermissionIds":
        result = await client.getUserPermissionIds(parseAddress("userAddress", userAddress ?? ""));
        break;
      case "getUserPermissions":
        result = await client.getUserPermissions(parseAddress("userAddress", userAddress ?? ""));
        break;
      case "getActivePermissions":
        result = await client.getActivePermissions(parseAddress("userAddress", userAddress ?? ""));
        break;
      case "checkAccess":
        result = await client.checkAccess(
          permissionId,
          parseAddress("agentAddress", agentAddress ?? "")
        );
        break;
      case "getEscrow":
        result = await client.getEscrow(escrowId);
        break;
      case "previewSettlement":
        result = await client.previewSettlement(escrowId);
        break;
      case "checkAgentTrust":
        result = await client.checkAgentTrust(
          agentId,
          parseAddress("agentAddress", agentAddress ?? "")
        );
        break;
      case "getBalance":
        result = await client.getBalance(
          parseAddress("balanceAddress", balanceAddress ?? "")
        );
        break;
      default:
        throw new Error(`Unknown read op: ${op}`);
    }

    setOutput(result);
    const okResult = result as Result<unknown, PrmissionError>;
    setStatus(okResult.ok ? `${op} OK` : `${op} failed`, okResult.ok ? "good" : "bad");
  } catch (err) {
    setStatus(`Invalid input for ${op}.`, "bad");
    setOutput(err);
  }
}

async function runWrite(op: string) {
  if (!client) {
    setStatus("Create a client first.", "warn");
    return;
  }
  if (!writer) {
    setStatus("Connect a wallet to run write methods.", "warn");
    return;
  }

  try {
    setStatus(`Running ${op}...`);
    let result: unknown;

    switch (op) {
      case "grantPermission": {
        const merchant = parseOptionalInput(els.wMerchant().value);
        result = await writer.grantPermission({
          merchant: merchant ? parseAddress("merchant", merchant) : undefined,
          dataCategory: els.wDataCategory().value.trim(),
          purpose: els.wPurpose().value.trim(),
          compensationBps: parseNumber("compensationBps", els.wCompBps().value),
          upfrontFee: parseUsdc(els.wUpfrontFee().value.trim()),
          validityPeriod: parseNumber("validityPeriod", els.wValidity().value),
        });
        const r = result as Result<bigint, PrmissionError>;
        if (r.ok) {
          els.permissionId().value = r.value.toString();
          els.wPermissionId().value = r.value.toString();
          els.wAdminPermissionId().value = r.value.toString();
        }
        break;
      }
      case "depositEscrow": {
        const permissionId = parseBigint("permissionId", els.wPermissionId().value);
        const amount = parseUsdc(els.wEscrowAmount().value.trim());
        const agentId = parseBigint("agentId", els.wAgentId().value);
        result = await writer.depositEscrow(permissionId, amount, agentId);
        const r = result as Result<bigint, PrmissionError>;
        if (r.ok) {
          els.escrowId().value = r.value.toString();
          els.wEscrowId().value = r.value.toString();
          els.wSettleEscrowId().value = r.value.toString();
        }
        break;
      }
      case "reportOutcome": {
        const escrowId = parseBigint("escrowId", els.wEscrowId().value);
        result = await writer.reportOutcome({
          escrowId,
          outcomeValue: parseUsdc(els.wOutcomeValue().value.trim()),
          outcomeType: els.wOutcomeType().value.trim(),
          outcomeDescription: els.wOutcomeDesc().value.trim(),
        });
        break;
      }
      case "settle": {
        const escrowId = parseBigint("escrowId", els.wSettleEscrowId().value);
        result = await writer.settle(escrowId);
        break;
      }
      case "refundEscrow": {
        const escrowId = parseBigint("escrowId", els.wSettleEscrowId().value);
        result = await writer.refundEscrow(escrowId);
        break;
      }
      case "disputeSettlement": {
        const escrowId = parseBigint("escrowId", els.wSettleEscrowId().value);
        result = await writer.disputeSettlement(escrowId, els.wDisputeReason().value.trim());
        break;
      }
      case "revokePermission": {
        const permissionId = parseBigint("permissionId", els.wAdminPermissionId().value);
        result = await writer.revokePermission(permissionId);
        break;
      }
      case "expirePermission": {
        const permissionId = parseBigint("permissionId", els.wAdminPermissionId().value);
        result = await writer.expirePermission(permissionId);
        break;
      }
      case "ensureAllowance": {
        const amount = parseUsdc(els.wAllowanceAmount().value.trim());
        result = await writer.ensureAllowance(amount);
        break;
      }
      default:
        throw new Error(`Unknown write op: ${op}`);
    }

    setOutput(result);
    const okResult = result as Result<unknown, PrmissionError>;
    setStatus(okResult.ok ? `${op} OK` : `${op} failed`, okResult.ok ? "good" : "bad");
  } catch (err) {
    setStatus(`Invalid input for ${op}.`, "bad");
    setOutput(err);
  }
}

function resetAll() {
  client = null;
  writer = null;
  walletAddress = null;
  simplePermissionId = null;
  simpleEscrowId = null;
  simpleOutcomeReported = false;
  simplePreviewDone = false;
  simpleSettled = false;
  simpleDemoSettled = false;
  setStatus("Ready.");
  setOutput({});
  updateInfoPanels();
  updateSimpleIds();
  setNarrative(["Click “Connect Wallet” to start."]);
  updateSimpleControls();
}

function wireEvents() {
  els.toggleAdvanced().addEventListener("click", () => {
    const body = document.body;
    const next = !body.classList.contains("show-advanced");
    body.classList.toggle("show-advanced", next);
    els.toggleAdvanced().textContent = next ? "Hide Advanced" : "Show Advanced";
  });

  els.createClient().addEventListener("click", () => {
    setStatus("Creating client...");
    const created = createClientFromInputs();
    if (!created.ok) {
      client = null;
      writer = null;
      setStatus("Client create failed.", "bad");
      setOutput(created);
      updateInfoPanels();
      return;
    }
    client = created.value;
    writer = null; // signer must be reconnected for the new client
    setStatus("Client ready.", "good");
    setOutput({ network: client.network, contract: client.contractAddress });
    updateInfoPanels();
  });

  els.resetClient().addEventListener("click", resetAll);
  els.connectWallet().addEventListener("click", () => {
    connectWallet().catch((err) => {
      setStatus("Wallet connect failed.", "bad");
      setOutput(err);
    });
  });
  els.disconnectWallet().addEventListener("click", disconnectWallet);
  els.switchBase().addEventListener("click", () => {
    switchWalletNetwork().catch((err) => {
      setStatus("Wallet switch failed.", "bad");
      setOutput(err);
    });
  });

  els.sCreatePermission().addEventListener("click", () => {
    simpleCreatePermission().catch((err) => {
      setStatus("Step 2 failed.", "bad");
      setOutput(err);
    });
  });
  els.sDepositEscrow().addEventListener("click", () => {
    simpleDepositEscrow().catch((err) => {
      setStatus("Step 3 failed.", "bad");
      setOutput(err);
    });
  });
  els.sReportOutcome().addEventListener("click", () => {
    simpleReportOutcome().catch((err) => {
      setStatus("Step 4 failed.", "bad");
      setOutput(err);
    });
  });
  els.sPreviewSettlement().addEventListener("click", () => {
    simplePreviewSettlement().catch((err) => {
      setStatus("Step 5 failed.", "bad");
      setOutput(err);
    });
  });
  els.sSettle().addEventListener("click", () => {
    simpleSettle().catch((err) => {
      setStatus("Step 6 failed.", "bad");
      setOutput(err);
    });
  });
  els.sDemoSettle().addEventListener("click", () => {
    simpleDemoSettle().catch((err) => {
      setStatus("Demo settle failed.", "bad");
      setOutput(err);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("button[data-read]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const op = btn.getAttribute("data-read");
      if (!op) return;
      runRead(op).catch((err) => {
        setStatus(`${op} failed.`, "bad");
        setOutput(err);
      });
    });
  });

  document
    .querySelectorAll<HTMLButtonElement>("button[data-write]")
    .forEach((btn) => {
      btn.addEventListener("click", () => {
        const op = btn.getAttribute("data-write");
        if (!op) return;
        runWrite(op).catch((err) => {
          setStatus(`${op} failed.`, "bad");
          setOutput(err);
        });
      });
    });
}

function boot() {
  resetAll();
  wireEvents();

  // Create a default Base mainnet client on load for convenience.
  const created = PrmissionClient.create({ network: PrmissionNetwork.BaseMainnet });
  if (isOk(created)) {
    client = created.value;
    setStatus("Client ready.", "good");
    setOutput({ network: client.network, contract: client.contractAddress });
    updateInfoPanels();
  }
}

boot();
