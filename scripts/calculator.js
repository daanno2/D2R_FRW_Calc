/*
References:
https://www.theamazonbasin.com/wiki/index.php/Movement_speed

Player walk speed = max(Base walk * (100 + Speed) / 100 , Base walk / 4)
Player run speed = max(Base run + ( (Base walk * Speed) / 100) , Base walk / 4) 
ChargeSpeed = BaseRunSpeed * (1 + Skill_FRW / 100 + Armor_Speed / 100) + (BaseRunSpeed * 150%) BUT frw from items do not apply 

Speed is the sum of all movement speed modifiers, both positive and negative:

Source	Player speed modifier	Maximum
Faster Run/Walk	[ (150 * FR/W) / (150 + FR/W) ] [6]	+149
Burst of Speed	min(15 + [55 * [ (110*slvl) / (slvl+6) ] / 100] , 70)	+70
Frenzy	min(20 + [180 * [ (110*slvl) / (slvl+6) ] / 100] , 200)	+200
Increased Speed	min(7 + [43 * [ (110*slvl) / (slvl+6) ] / 100] , 50)	+50
Feral Rage	min(10 + [60 * [ (110 * ( [slvl/2] + 3) ) / ( ( [slvl/2] + 3) + 6) ] / 100] , 70)	+70
Vigor	min(7 + [43 * [ (110*slvl) / (slvl+6) ] / 100] , 50)	+50
Delirium	+33	+33
Body armor speed penalty	0/-5/-10	-10
Shield speed penalty	0/-5/-10	-10
Cold length	-50	-50
Holy Freeze	min(-25 + [-35 * [ (110*slvl) /(slvl+6) ] / 100] , -60)	-50
Decrepify	-50	-50
Slows Target	10-50	-50


*/
const baseWalkSpeed = 6;
const baseRunSpeed = 9;
let raw_itemFRW, skillFRW, totalSkillFRW;
let e_itemFRW, speed

//Get the values of the input fields
function updateInputVars() {
    //appears in order on UI
    raw_itemFRW = parseInt(document.getElementById('item-frw').value) || 0;
    skillFRW = parseInt(document.getElementById('skill-frw').value) || 0;

    armor = parseInt(document.getElementById('armor').value) || 1;
    pen_Armor = armor == 2 ? -5 : armor == 3 ? -10 : 0;

    shield = parseInt(document.getElementById('shield').value) || 1;
    pen_Shield = shield == 2 ? -5 : shield == 3 ? -10 : 0; 

    pen_Chilled = document.getElementById('isChilled').checked ? -50 : 0;
    pen_Decrep = document.getElementById('isDecrepified').checked ? -50 : 0;
    pen_Slowed = parseInt(document.getElementById('Slowed').value) * -1 || 0 

    slvl_BOS = parseInt(document.getElementById('BoS').value) || 0;
    buff_BOS = slvl_BOS == 0 ? 0: Math.min(15 + [55 * [ (110*slvl_BOS) / (slvl_BOS+6) ] / 100] , 70)

    slvl_FR = parseInt(document.getElementById('feralRage').value) || 0;
    buff_FR = slvl_FR == 0 ? 0: Math.min(10 + [60 * [ (110 * ( [slvl_FR/2] + 3) ) / ( ( [slvl_FR/2] + 3) + 6) ] / 100] , 70)

    slvl_Frenzy = parseInt(document.getElementById('Frenzy').value) || 0;
    buff_Frenzy = slvl_Frenzy == 0 ? 0: Math.min(20 + [180 * [ (110*slvl_Frenzy) / (slvl_Frenzy+6) ] / 100] , 200)

    slvl_HF = parseInt(document.getElementById('HolyFreeze').value) || 0;
    pen_HF = slvl_HF == 0 ? 0: -1 * Math.min(25 + (35 * ( (110*slvl_HF) /(slvl_HF+6) ) / 100) , 60);

    slvl_IS = parseInt(document.getElementById('IncreaseSpeed').value) || 0;
    buff_IS = slvl_IS == 0 ? 0: Math.min(7 + [43 * [ (110*slvl_IS) / (slvl_IS+6) ] / 100] , 50)

    slvl_Vigor = parseInt(document.getElementById('Vigor').value) || 0;
    buff_Vigor = slvl_Vigor == 0 ? 0: Math.min(7 + [43 * [ (110*slvl_Vigor) / (slvl_Vigor+6) ] / 100] , 50)

    buff_Delirium = document.getElementById('isDelirium').checked ? 33 : 0;
}

function updateSpeeds() {
    //first, update the input variables
    updateInputVars();

    //Calculate intermediate variables

    //Penalties


    e_itemFRW = raw_itemFRW * 150 / (raw_itemFRW + 150);
    totalSkillFRW = pen_Armor + pen_Shield + pen_Chilled + pen_Decrep + pen_Slowed + buff_BOS + buff_FR + buff_Frenzy + pen_HF + buff_IS + buff_Vigor + buff_Delirium;
    skillFRW = skillFRW + totalSkillFRW;

    speed = e_itemFRW + skillFRW;

    //calculate final variables and refresh the UI
    document.getElementById('walk-speed').textContent = calculateWalkSpeed().toFixed(2);
    document.getElementById('run-speed').textContent = calculateRunSpeed().toFixed(2);
    document.getElementById('charge-speed').textContent = calculateChargeSpeed().toFixed(2);
}


function calculateWalkSpeed() {
    walkSpeed = baseWalkSpeed * (100 + speed) / 100;
    return Math.max(walkSpeed, baseWalkSpeed/4);
}
function calculateRunSpeed() {
    runSpeed = baseRunSpeed + ( (baseWalkSpeed * speed) / 100);
    return Math.max(runSpeed, baseWalkSpeed/4);
}

function calculateChargeSpeed() {
    chargeSpeed = (baseRunSpeed * 1.5) + baseRunSpeed * (1 + Math.max(-50, skillFRW)/100);
    return chargeSpeed;
}

function updateArmorLabel() {
    const armorValue = document.getElementById('armor').value;
    const armorLabel = armorValue == 1 ? 'Light' : armorValue == 2 ? 'Medium' : 'Heavy';
    document.getElementById('armor-label').textContent = armorLabel;
}

function updateShieldLabel() {
    const armorValue = document.getElementById('shield').value;
    const armorLabel = armorValue == 1 ? 'Light' : armorValue == 2 ? 'Medium' : 'Heavy';
    document.getElementById('shield-label').textContent = armorLabel;
}

/*
Add event listeners when DOM is loaded
Input types with ClassName 'input-group' will automatically have event listeners added
*/
document.addEventListener('DOMContentLoaded', () => {
    const inputGroups = document.getElementsByClassName('input-group');
    for (let group of inputGroups) {
        const inputs = group.getElementsByTagName('input');
        for (let input of inputs) {
            input.addEventListener('input', updateSpeeds);
        }
    }
    document.getElementById('armor').addEventListener('input', updateArmorLabel);
    document.getElementById('shield').addEventListener('input', updateShieldLabel);

    // Initial setup
    updateInputVars();
    updateSpeeds();
    updateArmorLabel();
    updateShieldLabel();
});