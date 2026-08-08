import "./AddLiquidityCard.css";

import { useEffect, useMemo, useState } from "react";
import { Contract, ethers } from "ethers";

import TokenInput from "../TokenInput/TokenInput";
import SwapButton from "../SwapButton/SwapButton";
import TokenModal from "../TokenModal/TokenModal";
import Toast from "../Toast/Toast";

import { CHAINS } from "../../config/chain";

import { useWallet } from "../../context/WalletContext";
import { useNavigation } from "../../context/NavigationContext";
import { useLiquidity } from "../../hooks/useLiquidity";

import EasySwapFactory from "../../abi/EasySwapFactory.json";
import EasySwapPair from "../../abi/EasySwapPair.json";

export default function AddLiquidityCard() {
  const {
    chainId,
    connected,
    provider,
    address
  } = useWallet();

  const { navigate } = useNavigation();

  const chain = useMemo(() => {
    return CHAINS.find(c => c.chainId === chainId);
  }, [chainId]);

  const {
    approve,
    addLiquidity,
    addLiquidityETH
  } = useLiquidity();

  // =====================================================
  // TOKENS
  // =====================================================

  const [tokenA, setTokenA] = useState(
    chain?.nativeSymbol ?? "QTER"
  );

  const [tokenB, setTokenB] = useState("HEX");

  const tokenInfoA = useMemo(() => {
    if (!chain) return null;

    return chain.tokens.find(
      t => t.symbol === tokenA
    );
  }, [chain, tokenA]);

  const tokenInfoB = useMemo(() => {
    if (!chain) return null;

    return chain.tokens.find(
      t => t.symbol === tokenB
    );
  }, [chain, tokenB]);

  // =====================================================
  // INPUT
  // =====================================================

  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");

  const [lastEdited, setLastEdited] =
    useState<"A" | "B">("A");

  // =====================================================
  // BALANCE
  // =====================================================

  const [balanceA, setBalanceA] = useState("--");
  const [balanceB, setBalanceB] = useState("--");

  // =====================================================
  // POOL INFO
  // =====================================================

  const [price, setPrice] = useState("--");
  const [poolShare, setPoolShare] = useState("--");
  const [lpMinted, setLpMinted] = useState("--");
  const [priceImpact, setPriceImpact] = useState("--");
  const [minimumReceived, setMinimumReceived] =
    useState("--");

  // =====================================================
  // RESERVES
  // =====================================================

  const [reserve0, setReserve0] =
    useState<bigint>(0n);

  const [reserve1, setReserve1] =
    useState<bigint>(0n);

  const [totalSupply, setTotalSupply] =
    useState<bigint>(0n);

  const [pairAddress, setPairAddress] =
    useState<string | null>(null);

  // =====================================================
  // UI
  // =====================================================

  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [selectFirst, setSelectFirst] =
    useState(true);

  const [toastOpen, setToastOpen] =
    useState(false);

  const [txHash, setTxHash] =
    useState("");

  const [slippage, setSlippage] =
    useState(0.5);

  const [error, setError] =
    useState("");

  // =====================================================
  // TOAST AUTO CLOSE
  // =====================================================

  useEffect(() => {
    if (!toastOpen) return;

    const timer = setTimeout(() => {
      setToastOpen(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, [toastOpen]);

  // =====================================================
  // RESOLVE TOKEN ADDRESS
  // =====================================================

  function resolvePairAddress(info: any) {
    if (!info) return null;

    if (info.address === "native") {
      return chain?.wrappedNative ?? null;
    }

    return info.address;
  }

  // =====================================================
  // LOAD BALANCES
  // =====================================================

  async function refreshBalance() {
    if (!provider || !address || !chain) {
      setBalanceA("--");
      setBalanceB("--");
      return;
    }

    try {
      // -------------------------------------------------
      // TOKEN A
      // -------------------------------------------------

      if (tokenInfoA?.address === "native") {
        const bal =
          await provider.getBalance(address);

        setBalanceA(
          Number(
            ethers.formatEther(bal)
          ).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 6
            }
          )
        );
      } else if (tokenInfoA) {
        const erc20 =
          new Contract(
            tokenInfoA.address,
            [
              "function balanceOf(address owner) view returns (uint256)"
            ],
            provider
          );

        const bal =
          await erc20.balanceOf(address);

        setBalanceA(
          Number(
            ethers.formatUnits(
              bal,
              tokenInfoA.decimals
            )
          ).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 6
            }
          )
        );
      }

      // -------------------------------------------------
      // TOKEN B
      // -------------------------------------------------

      if (tokenInfoB?.address === "native") {
        const bal =
          await provider.getBalance(address);

        setBalanceB(
          Number(
            ethers.formatEther(bal)
          ).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 6
            }
          )
        );
      } else if (tokenInfoB) {
        const erc20 =
          new Contract(
            tokenInfoB.address,
            [
              "function balanceOf(address owner) view returns (uint256)"
            ],
            provider
          );

        const bal =
          await erc20.balanceOf(address);

        setBalanceB(
          Number(
            ethers.formatUnits(
              bal,
              tokenInfoB.decimals
            )
          ).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 6
            }
          )
        );
      }
    } catch (e) {
      console.log(
        "Balance error:",
        e
      );
    }
  }

  useEffect(() => {
    refreshBalance();
  }, [
    provider,
    address,
    chainId,
    tokenA,
    tokenB
  ]);

  // =====================================================
  // MAX
  // =====================================================

  function maxA() {
    if (balanceA === "--") return;

    setLastEdited("A");

    setAmountA(
      balanceA.replace(/,/g, "")
    );
  }

  function maxB() {
    if (balanceB === "--") return;

    setLastEdited("B");

    setAmountB(
      balanceB.replace(/,/g, "")
    );
  }

  // =====================================================
  // TOKEN MODAL
  // =====================================================

  function openA() {
    setSelectFirst(true);
    setModalOpen(true);
  }

  function openB() {
    setSelectFirst(false);
    setModalOpen(true);
  }

  function selectToken(symbol: string) {
    if (selectFirst) {
      setTokenA(symbol);
    } else {
      setTokenB(symbol);
    }

    setModalOpen(false);
  }

  // =====================================================
  // LOAD PAIR
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    async function loadPair() {
      setPairAddress(null);
      setReserve0(0n);
      setReserve1(0n);
      setTotalSupply(0n);

      if (
        !provider ||
        !chain ||
        !tokenInfoA ||
        !tokenInfoB
      ) {
        return;
      }

      const addrA =
        resolvePairAddress(tokenInfoA);

      const addrB =
        resolvePairAddress(tokenInfoB);

      if (!addrA || !addrB) return;

      try {
        const factory =
          new Contract(
            chain.factory,
            EasySwapFactory.abi,
            provider
          );

        const pair =
          await factory.getPair(
            addrA,
            addrB
          );

        if (cancelled) return;

        if (
          !pair ||
          pair === ethers.ZeroAddress
        ) {
          return;
        }

        setPairAddress(pair);

        const pairContract =
          new Contract(
            pair,
            EasySwapPair.abi,
            provider
          );

        const [
          reserves,
          token0,
          supply
        ] = await Promise.all([
          pairContract.getReserves(),
          pairContract.token0(),
          pairContract.totalSupply()
        ]);

        if (cancelled) return;

        if (
          token0.toLowerCase() ===
          addrA.toLowerCase()
        ) {
          setReserve0(reserves[0]);
          setReserve1(reserves[1]);
        } else {
          setReserve0(reserves[1]);
          setReserve1(reserves[0]);
        }

        setTotalSupply(supply);
      } catch (e) {
        console.log(
          "Pair load error:",
          e
        );
      }
    }

    loadPair();

    return () => {
      cancelled = true;
    };
  }, [
    provider,
    chain,
    tokenInfoA,
    tokenInfoB
  ]);

  // =====================================================
  // POOL MATH
  // =====================================================

  useEffect(() => {
    if (
      !tokenInfoA ||
      !tokenInfoB
    ) {
      return;
    }

    const hasPool =
      reserve0 > 0n &&
      reserve1 > 0n;

    try {
      const decA =
        tokenInfoA.decimals;

      const decB =
        tokenInfoB.decimals;

      const numA =
        parseFloat(amountA);

      const numB =
        parseFloat(amountB);

      // -------------------------------------------------
      // PRICE
      // -------------------------------------------------

      if (hasPool) {
        const r0 =
          Number(
            ethers.formatUnits(
              reserve0,
              decA
            )
          );

        const r1 =
          Number(
            ethers.formatUnits(
              reserve1,
              decB
            )
          );

        if (r0 > 0) {
          setPrice(
            (r1 / r0).toLocaleString(
              undefined,
              {
                maximumFractionDigits: 8
              }
            )
          );
        }
      } else if (
        numA > 0 &&
        numB > 0
      ) {
        setPrice(
          (numB / numA).toLocaleString(
            undefined,
            {
              maximumFractionDigits: 8
            }
          )
        );
      } else {
        setPrice("--");
      }

      // -------------------------------------------------
      // AUTO AMOUNT B
      // -------------------------------------------------

      if (hasPool) {
        const r0 =
          Number(
            ethers.formatUnits(
              reserve0,
              decA
            )
          );

        const r1 =
          Number(
            ethers.formatUnits(
              reserve1,
              decB
            )
          );

        if (
          lastEdited === "A" &&
          numA > 0 &&
          r0 > 0
        ) {
          const computedB =
            (numA * r1) / r0;

          const formatted =
            computedB.toFixed(6);

          if (
            formatted !== amountB
          ) {
            setAmountB(formatted);
          }
        }

        if (
          lastEdited === "B" &&
          numB > 0 &&
          r1 > 0
        ) {
          const computedA =
            (numB * r0) / r1;

          const formatted =
            computedA.toFixed(6);

          if (
            formatted !== amountA
          ) {
            setAmountA(formatted);
          }
        }
      }

      // -------------------------------------------------
      // PRICE IMPACT
      // -------------------------------------------------

      if (
        hasPool &&
        numA > 0 &&
        numB > 0
      ) {
        const r0 =
          Number(
            ethers.formatUnits(
              reserve0,
              decA
            )
          );

        const r1 =
          Number(
            ethers.formatUnits(
              reserve1,
              decB
            )
          );

        const poolRatio =
          r1 / r0;

        const depositRatio =
          numB / numA;

        const deviation =
          Math.abs(
            depositRatio -
            poolRatio
          ) /
          poolRatio *
          100;

        setPriceImpact(
          `${deviation.toFixed(2)}%`
        );
      } else {
        setPriceImpact(
          hasPool
            ? "--"
            : "0.00% (new pool)"
        );
      }

      // -------------------------------------------------
      // LP MINT
      // -------------------------------------------------

      if (
        numA > 0 &&
        numB > 0
      ) {
        let minted: number;

        if (
          hasPool &&
          totalSupply > 0n
        ) {
          const r0 =
            Number(
              ethers.formatUnits(
                reserve0,
                decA
              )
            );

          const r1 =
            Number(
              ethers.formatUnits(
                reserve1,
                decB
              )
            );

          const supply =
            Number(
              ethers.formatUnits(
                totalSupply,
                18
              )
            );

          const mintedFromA =
            (numA * supply) /
            r0;

          const mintedFromB =
            (numB * supply) /
            r1;

          minted =
            Math.min(
              mintedFromA,
              mintedFromB
            );

          const newSupply =
            supply + minted;

          setPoolShare(
            `${(
              (minted /
                newSupply) *
              100
            ).toFixed(4)}%`
          );
        } else {
          minted =
            Math.sqrt(
              numA * numB
            );

          setPoolShare(
            "100.00%"
          );
        }

        setLpMinted(
          minted.toLocaleString(
            undefined,
            {
              maximumFractionDigits: 6
            }
          )
        );

        const minReceived =
          minted *
          (1 - slippage / 100);

        setMinimumReceived(
          minReceived.toLocaleString(
            undefined,
            {
              maximumFractionDigits: 6
            }
          )
        );
      } else {
        setLpMinted("--");
        setPoolShare("--");
        setMinimumReceived("--");
      }
    } catch (e) {
      console.log(
        "Pool math error:",
        e
      );
    }
  }, [
    amountA,
    amountB,
    reserve0,
    reserve1,
    totalSupply,
    tokenInfoA,
    tokenInfoB,
    slippage,
    lastEdited
  ]);

  // =====================================================
  // INPUT
  // =====================================================

  function handleAmountAChange(
    value: string
  ) {
    setLastEdited("A");
    setAmountA(value);
  }

  function handleAmountBChange(
    value: string
  ) {
    setLastEdited("B");
    setAmountB(value);
  }

  // =====================================================
  // SUBMIT
  // =====================================================

  const isNativePair =
    tokenInfoA?.address === "native" ||
    tokenInfoB?.address === "native";

  const canSubmit =
    connected &&
    !!tokenInfoA &&
    !!tokenInfoB &&
    parseFloat(amountA) > 0 &&
    parseFloat(amountB) > 0 &&
    !loading;

  async function handleAddLiquidity() {
    if (
      !chain ||
      !tokenInfoA ||
      !tokenInfoB
    ) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const amountABig =
        ethers.parseUnits(
          amountA,
          tokenInfoA.decimals
        );

      const amountBBig =
        ethers.parseUnits(
          amountB,
          tokenInfoB.decimals
        );

      let receipt;

      if (isNativePair) {
        const [
          erc20Info,
          erc20Amount,
          nativeAmount
        ] =
          tokenInfoA.address === "native"
            ? [
                tokenInfoB,
                amountBBig,
                amountABig
              ]
            : [
                tokenInfoA,
                amountABig,
                amountBBig
              ];

        await approve(
          erc20Info.address,
          erc20Amount
        );

        receipt =
          await addLiquidityETH(
            erc20Info.address,
            erc20Amount,
            nativeAmount
          );
      } else {
        await approve(
          tokenInfoA.address,
          amountABig
        );

        await approve(
          tokenInfoB.address,
          amountBBig
        );

        receipt =
          await addLiquidity(
            tokenInfoA.address,
            tokenInfoB.address,
            amountABig,
            amountBBig
          );
      }

      setTxHash(
        receipt?.hash ?? ""
      );

      setToastOpen(true);

      setAmountA("");
      setAmountB("");

      await refreshBalance();
    } catch (e: any) {
      console.log(e);

      setError(
        e?.shortMessage ??
        e?.message ??
        "Transaction failed"
      );
    } finally {
      setLoading(false);
    }
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="add-liquidity-wrapper">

      <div className="add-liquidity-card">

        <div className="add-liquidity-header">

          <h2>
            Add Liquidity
          </h2>

          <button
            type="button"
            className="back-button"
            onClick={() => navigate("pool")}
          >
            Back
          </button>

        </div>

        <TokenInput
          title="Token A"
          token={tokenA}
          amount={amountA}
          balance={balanceA}
          onAmountChange={
            handleAmountAChange
          }
          onMax={maxA}
          onTokenClick={openA}
        />

        <div className="add-liquidity-plus">
          +
        </div>

        <TokenInput
          title="Token B"
          token={tokenB}
          amount={amountB}
          balance={balanceB}
          onAmountChange={
            handleAmountBChange
          }
          onMax={maxB}
          onTokenClick={openB}
        />

        <div className="pool-info">

          <div className="pool-info-row">
            <span>Price</span>

            <span>
              {price === "--"
                ? "--"
                : `1 ${tokenA} = ${price} ${tokenB}`}
            </span>
          </div>

          <div className="pool-info-row">
            <span>
              Price impact
            </span>

            <span>
              {priceImpact}
            </span>
          </div>

          <div className="pool-info-row">
            <span>
              LP tokens minted
            </span>

            <span>
              {lpMinted}
            </span>
          </div>

          <div className="pool-info-row">
            <span>
              Pool share
            </span>

            <span>
              {poolShare}
            </span>
          </div>

          <div className="pool-info-row">
            <span>
              Minimum received (LP)
            </span>

            <span>
              {minimumReceived}
            </span>
          </div>

          <div className="pool-info-row">

            <span>
              Slippage tolerance
            </span>

            <span>

              <input
                type="number"
                min={0}
                max={50}
                step={0.1}
                value={slippage}
                onChange={e =>
                  setSlippage(
                    Number(
                      e.target.value
                    )
                  )
                }
                className="slippage-input"
              />

              %
            </span>

          </div>

        </div>

        {error && (
          <div className="add-liquidity-error">
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: "auto"
          }}
        >
          <SwapButton
            text={
              !connected
                ? "Connect wallet"
                : "Add Liquidity"
            }
            loadingText="Adding liquidity..."
            loading={loading}
            onClick={
              handleAddLiquidity
            }
            disabled={!canSubmit}
          />
        </div>

      </div>

      <TokenModal
        open={modalOpen}
        onClose={() =>
          setModalOpen(false)
        }
        onSelect={selectToken}
      />

      <Toast
        open={toastOpen}
        title="Success"
        message="Liquidity added successfully"
        tx={txHash}
        explorer={
          chain?.explorer?.replace(
            /\/+$/,
            ""
          )
        }
        onClose={() =>
          setToastOpen(false)
        }
      />

    </div>
  );
}