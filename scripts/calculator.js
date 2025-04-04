/*
References:
https://www.theamazonbasin.com/wiki/index.php/Movement_speed

Player walk speed = max(Base walk * (100 + Speed) / 100 , Base walk / 4)
Player run speed = max(Base run + ( (Base walk * Speed) / 100) , Base walk / 4) 
ChargeSpeed = BaseRunSpeed * (1 + Skill_FRW / 100 + Armor_Speed / 100) + (BaseRunSpeed * 150%) BUT frw from items do not apply 

Speed is the sum of all movement speed modifiers, both positive and negative:

Source	Player speed modifier	Maximum
Faster Run/Walk	( (150 * FR/W) / (150 + FR/W) ) (6)	+149
Burst of Speed	min(15 + (55 * ( (110*slvl) / (slvl+6) ) / 100) , 70)	+70
Frenzy	min(20 + (180 * ( (110*slvl) / (slvl+6) ) / 100) , 200)	+200
Increased Speed	min(7 + (43 * ( (110*slvl) / (slvl+6) ) / 100) , 50)	+50
Feral Rage	min(10 + (60 * ( (110 * ( (slvl/2) + 3) ) / ( ( (slvl/2) + 3) + 6) ) / 100) , 70)	+70
Vigor	min(7 + (43 * ( (110*slvl) / (slvl+6) ) / 100) , 50)	+50
Delirium	+33	+33 note: this comes from the "delerium change" skill in skill.txt
Body armor speed penalty	0/-5/-10	-10
Shield speed penalty	0/-5/-10	-10
Cold length	-50	-50
Holy Freeze	min(-25 + (-35 * ( (110*slvl) /(slvl+6) ) / 100) , -60)	-50
Decrepify	-50	-50
Slows Target	10-50	-50


*/
var baseWalkSpeed = 6;
var baseRunSpeed = 9;
const x_graph_max = 300;

var raw_itemFRW;
var e_itemFRW;
var totalSkillFRW;
var e_totalFrwBonus;

let x_frw = [];
for(i=0; i<=x_graph_max; i+=5){
    x_frw.push(i);
}

//Get the values of the input fields
function updateInputVars() {
    //appears in order on UI
    raw_itemFRW = parseInt(document.getElementById('item-frw').value) || 0;

    armor = parseInt(document.getElementById('armor').value) || 1;
    pen_Armor = armor == 2 ? -5 : armor == 3 ? -10 : 0;

    shield = parseInt(document.getElementById('shield').value) || 1;
    pen_Shield = shield == 2 ? -5 : shield == 3 ? -10 : 0; 

    pen_Chilled = document.getElementById('isChilled').checked ? -50 : 0;
    pen_Decrep = document.getElementById('isDecrepified').checked ? -50 : 0;
    pen_Slowed = -1* Math.min(50, parseInt(document.getElementById('Slowed').value) || 0 ) 

    slvl_Blaze = parseInt(document.getElementById('Blaze').value) || 0;
    buff_Blaze = 2 * slvl_Blaze;

    slvl_BOS = parseInt(document.getElementById('BoS').value) || 0;
    buff_BOS = slvl_BOS == 0 ? 0: Math.min(15 + (55 * ( (110*slvl_BOS) / (slvl_BOS+6) ) / 100) , 70)

    slvl_FR = parseInt(document.getElementById('feralRage').value) || 0;
    buff_FR = slvl_FR == 0 ? 0: Math.min(10 + (60 * ( (110 * ( (slvl_FR/2) + 3) ) / ( ( (slvl_FR/2) + 3) + 6) ) / 100) , 70)

    slvl_Frenzy = parseInt(document.getElementById('Frenzy').value) || 0;
    buff_Frenzy = slvl_Frenzy == 0 ? 0: Math.min(20 + (180 * ( (110*slvl_Frenzy) / (slvl_Frenzy+6) ) / 100) , 200)

    slvl_HF = parseInt(document.getElementById('HolyFreeze').value) || 0;

    /* note: -60 is the max HF slowdown in theory, but players have chill effectivness of -50,
     so for these purposes we're setting it to -50
    https://www.theamazonbasin.com/wiki/index.php/Chill_effectiveness
     */
    //pen_HF = slvl_HF == 0 ? 0: -1 * Math.min(25 + (35 * ( (110*slvl_HF) /(slvl_HF+6) ) / 100) , 60);
    pen_HF = slvl_HF == 0 ? 0: -1 * Math.min(25 + (35 * ( (110*slvl_HF) /(slvl_HF+6) ) / 100) , 50);

    slvl_IS = parseInt(document.getElementById('IncreaseSpeed').value) || 0;
    buff_IS = slvl_IS == 0 ? 0: Math.min(7 + (43 * ( (110*slvl_IS) / (slvl_IS+6) ) / 100) , 50)

    slvl_Vigor = parseInt(document.getElementById('Vigor').value) || 0;
    buff_Vigor = slvl_Vigor == 0 ? 0: Math.min(7 + (43 * ( (110*slvl_Vigor) / (slvl_Vigor+6) ) / 100) , 50)

    buff_Delirium = document.getElementById('isDelirium').checked ? 33 : 0;
    document.getElementById('isDelirium').checked ? baseRunSpeed = 6 : baseRunSpeed = 9;

}

function updateSpeeds() {
    //first, update the input variables
    updateInputVars();

    totalSkillFRW = Math.trunc(pen_Armor + pen_Shield + pen_Chilled + pen_Decrep + pen_Slowed 
    + buff_Blaze + buff_BOS + buff_FR + buff_Frenzy + pen_HF + buff_IS + buff_Vigor + buff_Delirium);


    //calculate final variables and refresh the UI
    e_totalFrwBonus = calculatee_totalFrwBonus(raw_itemFRW);

    document.getElementById('walk-speed').textContent = calculateWalkSpeed(e_totalFrwBonus);
    document.getElementById('run-speed').textContent = calculateRunSpeed(e_totalFrwBonus);
    document.getElementById('charge-speed').textContent = calculateChargeSpeed();
    document.getElementById('efrw').textContent =  e_totalFrwBonus + "% (Items: " + e_itemFRW + "%, Skills: " + totalSkillFRW + "%)";
    if(document.getElementById("frwChart").style.display != "none"){
        updateChart();
    }
}

function calculatee_totalFrwBonus(f_raw_itemFRW) {
    //Calculate intermediate variables
    e_itemFRW = Math.trunc(f_raw_itemFRW * 150 / (f_raw_itemFRW + 150)); //https://github.com/ThePhrozenKeep/D2MOO/blob/8322494ed1f715ad51552f169df76cf600fabc71/source/D2Common/src/Units/Units.cpp#L1248
    speed = e_itemFRW + totalSkillFRW; //https://github.com/ThePhrozenKeep/D2MOO/blob/8322494ed1f715ad51552f169df76cf600fabc71/source/D2Common/src/Units/Units.cpp#L1677

    return speed;
}

function calculateWalkSpeed(speed) {
    walkSpeed = baseWalkSpeed * (100 + speed) / 100;
    return Math.max(walkSpeed, baseWalkSpeed/4).toFixed(2);
}

function calculateRunSpeed(speed) {
    runSpeed = baseRunSpeed + (baseWalkSpeed * speed) / 100;
    return Math.max(runSpeed, baseWalkSpeed/4).toFixed(2);
}
function calculateChargeSpeed() {
    chargeSpeed = (baseRunSpeed * 1.5) + baseRunSpeed * (1 + Math.max(-50, totalSkillFRW)/100);
    return chargeSpeed.toFixed(2);
}
//todo: add knockback speed calc?
//void __stdcall UNITS_CharacterStartRunningOrKnockback(D2UnitStrc* pUnit, int nClassId)
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
function showHideGraph() {
    var x = document.getElementById("frwChart");
    if (x.style.display === "none") {
        x.style.display = "block";
        updateChart();
        document.getElementById('showHideGraph').textContent = "Hide Graph";
    } else {
        x.style.display = "none";
        document.getElementById('showHideGraph').textContent = "Show Graph";
    }
}
function updateChart(){

    let y_walk = [];
    let y_run = [];

    for(i=0; i<x_frw.length; i++) {
        y_walk_val = calculateWalkSpeed(calculatee_totalFrwBonus(x_frw[i]));
        y_run_val = calculateRunSpeed(calculatee_totalFrwBonus(x_frw[i]));
        y_walk.push(y_walk_val);
        y_run.push(y_run_val);
    }
    var walkGraph = {
        name: 'Walk',
        x: x_frw,
        y: y_walk,
        mode: 'markers',
        type: 'scatter'
    };
    var runGraph = {
        name: 'Run',
        x: x_frw,
        y: y_run,
        mode: 'markers',
        type: 'scatter'
    };
    var layout = {
        title: {
            text: "Effective FRW vs Equip FRW at current settings",
            automargin: true
        },
        xaxis: {range: [0, x_graph_max], title: {text: "Equipment frw"}},
        yaxis: {range: [3, 20],  title: {text: "Yards/s"}},
        hovermode: 'x unified',
        showlegend: true,
        legend: {
            x: 1,
            xanchor: 'right',
            y: 1
          },
        margin: { t: 0 },
        paper_bgcolor: 'black',
        plot_bgcolor: 'grey',
        font: {
            color: 'white'
        }
    };
    var config = {
        displaylogo: false,
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['toImage', 'zoom2d','select2d', 'lasso2d', 'sendDataToCloud', 'autoScale2d', 'hoverClosestCartesian', 'hoverCompareCartesian'],
        };
    Plotly.newPlot("frwChart", [walkGraph,runGraph], layout, config);
}
function resetAllFields(){
    const inputGroups = document.getElementsByClassName('input-group');
    for (let group of inputGroups) {
        const inputs = group.getElementsByTagName('input');
        for (let input of inputs) {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = input.defaultValue;
            }
        }
    }
    updateSpeeds();
    updateArmorLabel();
    updateShieldLabel();
    updateUrlParams(); 
}
function setInputsFromUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Handle number and checkbox inputs
    const inputMap = {
        'item-frw': 'number',
        'armor': 'range',
        'shield': 'range',
        'isChilled': 'checkbox',
        'isDecrepified': 'checkbox',
        'Slowed': 'number',
        'Blaze': 'number',
        'BoS': 'number',
        'feralRage': 'number',
        'Frenzy': 'number',
        'HolyFreeze': 'number',
        'IncreaseSpeed': 'number',
        'Vigor': 'number',
        'isDelirium': 'checkbox'
    };

    for (const [inputId, inputType] of Object.entries(inputMap)) {
        if (urlParams.has(inputId)) {
            const element = document.getElementById(inputId);
            if (element) {
                if (inputType === 'checkbox') {
                    element.checked = urlParams.get(inputId) === 'true';
                } else {
                    element.value = urlParams.get(inputId);
                }
            }
        }
    }
}

function updateUrlParams() {
    const params = new URLSearchParams();
    const inputGroups = document.getElementsByClassName('input-group');
    
    for (let group of inputGroups) {
        const inputs = group.getElementsByTagName('input');
        for (let input of inputs) {
            const value = input.type === 'checkbox' ? input.checked : input.value;
            if (value && value !== '0' && value !== 'false') {
                params.set(input.id, value);
            }
        }
    }

    // Update URL without reloading the page
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({}, '', newUrl);
}

// Modify the DOMContentLoaded event listener to include URL parameter handling
document.addEventListener('DOMContentLoaded', () => {
    // ...existing code...
    
    // Add URL parameter handling to inputs
    const inputGroups = document.getElementsByClassName('input-group');
    for (let group of inputGroups) {
        const inputs = group.getElementsByTagName('input');
        for (let input of inputs) {
            input.addEventListener('input', () => {
                updateSpeeds();
                updateUrlParams();
            });
        }
    }

    // Set initial values from URL parameters if they exist
    setInputsFromUrlParams();
    
    // Initial setup
    updateInputVars();
    updateSpeeds();
    updateArmorLabel();
    updateShieldLabel();
});
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
    document.getElementById('reset-button').addEventListener('click', resetAllFields);
    document.getElementById('showHideGraph').addEventListener('click', showHideGraph);

    // Initial setup
    updateInputVars();
    updateSpeeds();
    updateArmorLabel();
    updateShieldLabel();
});