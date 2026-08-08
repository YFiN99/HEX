import "./SettingsModal.css";

type Props={

open:boolean;

onClose:()=>void;

};

export default function SettingsModal({

open,

onClose

}:Props){

if(!open) return null;

return(

<div className="settingOverlay">

<div className="settingCard">

<h2>

Transaction Settings

</h2>

<div className="settingItem">

<label>

Slippage

</label>

<input

defaultValue="0.5"

/>

%

</div>

<div className="settingItem">

<label>

Deadline

</label>

<input

defaultValue="20"

/>

min

</div>

<button

className="closeSetting"

onClick={onClose}

>

Done

</button>

</div>

</div>

);

}