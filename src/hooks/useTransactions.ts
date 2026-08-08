import { useState } from "react";

export type TxItem = {

    hash: string;

    type:

        | "SWAP"

        | "ADD"

        | "REMOVE";

    status:

        | "Pending"

        | "Success"

        | "Failed";

    time: number;

};

export default function useTransactions() {

    const [

        transactions,

        setTransactions

    ] = useState<TxItem[]>([]);

    function addTransaction(

        tx: TxItem

    ) {

        setTransactions(

            old => [

                tx,

                ...old

            ]

        );

    }

    function updateStatus(

        hash: string,

        status: TxItem["status"]

    ) {

        setTransactions(

            old =>

                old.map(tx =>

                    tx.hash === hash

                        ? {

                              ...tx,

                              status

                          }

                        : tx

                )

        );

    }

    function clear() {

        setTransactions([]);

    }

    return {

        transactions,

        addTransaction,

        updateStatus,

        clear

    };

}