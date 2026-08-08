import "./PositionCard.css";

type Props={

token0:string;

token1:string;

lp:string;

share:string;

amount0:string;

amount1:string;

onManage?:()=>void;

};

export default function PositionCard({

token0,

token1,

lp,

share,

amount0,

amount1,

onManage

}:Props){

return(

<div className="positionCard">

<div className="pair">

<h2>

{token0} / {token1}

</h2>

<button

className="manageButton"

onClick={onManage}

>

Manage

</button>

</div>

<div className="positionRow">

<span>

LP Balance

</span>

<b>

{lp}

</b>

</div>

<div className="positionRow">

<span>

Pool Share

</span>

<b>

{share}

</b>

</div>

<div className="positionRow">

<span>

{token0}

</span>

<b>

{amount0}

</b>

</div>

<div className="positionRow">

<span>

{token1}

</span>

<b>

{amount1}

</b>

</div>

</div>

);

}