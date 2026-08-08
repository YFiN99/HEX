import "./Roadmap.css";

export default function Roadmap() {
    return (
        <main className="roadmap-page">

            <div className="roadmap-container">

                <div className="roadmap-header">
                    <h1>HEX Roadmap</h1>

                    <p>
                        The development path of the HEX decentralized exchange.
                    </p>
                </div>


                <div className="roadmap-list">

                    <section className="roadmap-item">

                        <div className="roadmap-number">
                            01
                        </div>

                        <div className="roadmap-content">

                            <h2>
                                Independent Development
                            </h2>

                            <p>
                                HEX is currently developed as an independent
                                project. The initial development focuses on
                                building the core DEX infrastructure, including
                                Swap, Pool, HEXRouter, HexFactory, and HexPair.
                            </p>

                        </div>

                    </section>


                    <section className="roadmap-item">

                        <div className="roadmap-number">
                            02
                        </div>

                        <div className="roadmap-content">

                            <h2>
                                Investor Funding
                            </h2>

                            <p>
                                HEX is currently seeking potential investors
                                or funding partners to support the continued
                                development and expansion of the project.
                            </p>

                        </div>

                    </section>


                    <section className="roadmap-item">

                        <div className="roadmap-number">
                            03
                        </div>

                        <div className="roadmap-content">

                            <h2>
                                Domain &amp; Infrastructure Upgrade
                            </h2>

                            <p>
                                After securing funding, HEX plans to upgrade
                                its domain, infrastructure, hosting, and other
                                services required to support the project's growth.
                            </p>

                        </div>

                    </section>


                    <section className="roadmap-item">

                        <div className="roadmap-number">
                            04
                        </div>

                        <div className="roadmap-content">

                            <h2>
                                Ecosystem Development
                            </h2>

                            <p>
                                Further development will focus on improving
                                the HEX ecosystem, user experience, security,
                                and protocol infrastructure.
                            </p>

                        </div>

                    </section>


                    <section className="roadmap-item">

                        <div className="roadmap-number">
                            05
                        </div>

                        <div className="roadmap-content">

                            <h2>
                                Future Expansion
                            </h2>

                            <p>
                                Additional features and ecosystem initiatives
                                may be introduced as the project develops and
                                resources become available.
                            </p>

                        </div>

                    </section>

                </div>

            </div>

        </main>
    );
}