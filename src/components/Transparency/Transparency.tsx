import React from "react";
import "./Transparency.css";

export default function Transparency() {
    return (
        <main className="transparency-page">

            {/* HEADER */}
            <section className="transparency-header">
                <h1>HEX Principles</h1>

                <p className="transparency-lead">
                    <strong>
                        HEX upholds the principles of FAIRNESS and DECENTRALIZATION.
                    </strong>
                </p>

                <p>
                    HEX is designed so that trading mechanisms operate
                    transparently, openly, and can be verified on-chain.
                    No party should receive preferential treatment within
                    the trading mechanisms established by the protocol.
                </p>
            </section>


            {/* 01 — SPOT SETTLEMENT */}
            <section className="transparency-section">

                <div className="section-number">
                    01
                </div>

                <div className="section-content">

                    <h2>
                        Spot Settlement &amp; Fair Trading
                    </h2>

                    <p>
                        HEX uses <strong>on-chain settlement</strong>.
                        A swap is settled within the blockchain transaction
                        once it has been successfully confirmed.
                    </p>

                    <p>
                        <strong>
                            HEXRouter prioritizes fairness for all users
                        </strong>,
                        with open and transparent trading mechanisms.
                    </p>

                </div>

            </section>


            {/* 02 — TRANSPARENT FEE */}
            <section className="transparency-section">

                <div className="section-number">
                    02
                </div>

                <div className="section-content">

                    <h2>
                        Transparent Fee
                    </h2>

                    <p className="fee-title">
                        Total Swap Fee
                    </p>

                    <div className="fee-value">
                        0.30%
                    </div>


                    <div className="fee-breakdown">

                        <div className="fee-row">

                            <div className="fee-percent">
                                0.15%
                            </div>

                            <div className="fee-description">
                                <strong>
                                    Protocol Fee
                                </strong>

                                <span>
                                    → feeTo
                                </span>
                            </div>

                        </div>


                        <div className="fee-row">

                            <div className="fee-percent">
                                0.15%
                            </div>

                            <div className="fee-description">
                                <strong>
                                    Pool
                                </strong>

                                <span>
                                    → remains part of the pool
                                </span>
                            </div>

                        </div>

                    </div>


                    <p>
                        The fee distribution can be verified according
                        to the protocol's on-chain mechanism.
                    </p>

                </div>

            </section>


            {/* 03 — RISK DISCLOSURE */}
            <section className="transparency-section">

                <div className="section-number">
                    03
                </div>

                <div className="section-content">

                    <h2>
                        Risk Disclosure
                    </h2>

                    <p>
                        Users should understand the risks associated with
                        swapping and providing liquidity.
                    </p>


                    <div className="risk-list">

                        <span>
                            Slippage
                        </span>

                        <span>
                            Price Impact
                        </span>

                        <span>
                            Impermanent Loss
                        </span>

                        <span>
                            Smart Contract Risk
                        </span>

                        <span>
                            Network Risk
                        </span>

                        <span>
                            Asset Price Changes
                        </span>

                    </div>

                </div>

            </section>


            {/* 04 — DISCLAIMER */}
            <section className="transparency-section">

                <div className="section-number">
                    04
                </div>

                <div className="section-content">

                    <h2>
                        Disclaimer
                    </h2>


                    <div className="disclaimer-box">

                        <h3>
                            Trading Disclaimer
                        </h3>

                        <p>
                            This page explains the mechanisms of HEX
                            and its principles of transparent trading.
                        </p>

                        <p>
                            Users are responsible for understanding
                            the mechanisms, fees, risks, and transaction
                            terms before performing a swap or providing
                            liquidity.
                        </p>

                    </div>

                </div>

            </section>

        </main>
    );
}