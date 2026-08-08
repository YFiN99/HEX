export interface Token{

    symbol:string;

    name:string;

    address:string;

    decimals:number;

    logo:string;

}

export const TOKENS:Token[]=[

{

symbol:"QTER",

name:"Qantera",

address:"",

decimals:18,

logo:"/tokens/qter.svg"

},

{

symbol:"HEX",

name:"HEX",

address:"",

decimals:18,

logo:"/tokens/hex.svg"

},

{

symbol:"ETH",

name:"Ethereum",

address:"",

decimals:18,

logo:"/tokens/eth.svg"

},

{

symbol:"BTC",

name:"Bitcoin",

address:"",

decimals:8,

logo:"/tokens/btc.svg"

},

{

symbol:"USDT",

name:"Tether",

address:"",

decimals:6,

logo:"/tokens/usdt.svg"

}

];