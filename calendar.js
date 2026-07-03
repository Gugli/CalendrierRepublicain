const Rymes = [
"Fraternité", "Pue-des-pieds", "Calamité", "Saumon fumé",
"Re-liberté derrière", "Y'a plus'd'café", "C'est tout pété", 
"Poisson-pané", "Mange ta purée", "Chaussettes trouées",
"Chat échaudé", "Fromage râpé",  "Pain grillé",
"Plutôt stylé", "Faut dériver", "Poil aux nénés", 
"C'est plus c'que c'était"
]

const republicanMonths = [
"Vendémiaire","Brumaire","Frimaire",
"Nivôse","Pluviôse","Ventôse",
"Germinal","Floréal","Prairial",
"Messidor","Thermidor","Fructidor",
"Sans-culottides"
];

const republicanMonthsURL = [
"vendemiaire","brumaire","frimaire",
"nivose","pluviose","ventose",
"germinal","floreal","prairial",
"messidor","thermidor","fructidor",
"sansculottides"
];

const decadeNames = [
"Primidi","Duodi","Tridi","Quartidi","Quintidi",
"Sextidi","Septidi","Octidi","Nonidi","Décadi"
];

function getRepublicanDay(month, day) {
	return republicanDaysData.find(d => d.month === month && d.day === day);
}

// Calcul phase lunaire (approximation fiable)
function getMoonPhase(republicanYear, republicanMonth, republicanDay) {

	const startDate = new Date(1792, 8, 22);
	let totalDays = 0;
	for (let y = 1; y < republicanYear; y++) {
		totalDays += [3,7,11].includes(y) ? 366 : 365;
	}
	totalDays += republicanMonth * 30 + (republicanDay - 1);
	const gregDate = new Date(startDate.getTime() + totalDays * 86400000);
		
	const lunarCycle = 29.53058867;
	const knownNewMoon = new Date(Date.UTC(2000, 0, 6, 18, 14));
	// Nouvelle lune de référence : 6 janvier 2000

	const diffDays = (gregDate - knownNewMoon) / (1000*60*60*24);
	const phase = (diffDays % lunarCycle + lunarCycle) % lunarCycle;

	if (phase < 1.84566) return "🌑";		// Nouvelle lune
	if (phase < 5.53699) return "🌒";
	if (phase < 9.22831) return "🌓";
	if (phase < 12.91963) return "🌔";
	if (phase < 16.61096) return "🌕";		// Pleine lune
	if (phase < 20.30228) return "🌖";
	if (phase < 23.99361) return "🌗";
	if (phase < 27.68493) return "🌘";

	return "🌑";
}

function scrollToToday() {
	const todayElem = document.querySelector('.today');
	if (todayElem) {
		// On centre verticalement
		todayElem.scrollIntoView({ block: 'center' });
	}
}

// Base conversion simplifiée
function gregorianToRepublican(date) {
	const startDate = Date.UTC(1792, 8, 22);
	const utcDate = Date.UTC(
		date.getFullYear(),
		date.getMonth(),
		date.getDate()
	);

	const diffTime = utcDate - startDate;
	const diffDays = Math.floor(diffTime / (1000*60*60*24));

	const republicanYear = Math.floor(diffDays / 365.25) + 1;
	let dayOfYear = Math.floor(diffDays % 365.25);

	if (dayOfYear < 0) dayOfYear += 365;

	let month = Math.floor(dayOfYear / 30);
	let day = (dayOfYear % 30) + 1;

	if (month >= 12) {
		month = 12;
		day = dayOfYear - 360 + 1;
	}

	return { year: republicanYear, month, day };
}

let todayDate = new Date();
let currentRep = gregorianToRepublican(todayDate);
let viewMonth = currentRep.month;
let viewYear = currentRep.year;

function readURLParams() {
	const params = new URLSearchParams(window.location.search);

	const dayStr = params.get("day");
	if(dayStr) {
		dayDate = new Date(dayStr);
		if(!isNaN(dayDate)){
			todayDate = dayDate;
			currentRep = gregorianToRepublican(todayDate);
			viewMonth = currentRep.month;
			viewYear = currentRep.year;
			return;
		}
	}
	const dayRStr = params.get("dayR");
	if(dayRStr) {
		const dayRArray = dayRStr.split('-');
		if(dayRArray.length == 3) {
			const DD = parseInt(dayRArray[0]);
			const MM = parseInt(dayRArray[1]);
			const YYYY = parseInt(dayRArray[2]);
			if(!isNaN(DD) && !isNaN(MM) && !isNaN(YYYY)) {
				currentRep = { year: YYYY, month: MM, day: DD };
				viewMonth = currentRep.month;
				viewYear = currentRep.year;
				return;
			}
		}
	}
	const y = parseInt(params.get("year"));
	const m = params.get("month");

	if (!isNaN(y) && m) {
		viewYear = y;
		viewMonth = "vendemiaire";
		const monthIndex = republicanMonthsURL.indexOf(m.toLowerCase());
		if (monthIndex !== -1) {
			viewMonth = monthIndex;
		}
	}
}
	
function setURLParams(pushHistory) 
{
	const params = new URLSearchParams();
	params.set("year", viewYear);
	params.set("month", republicanMonthsURL[viewMonth]);
	const newURL = `${window.location.pathname}?${params.toString()}`;
	if(pushHistory ) {
		window.history.pushState({year: viewYear, month: viewMonth}, "", newURL);
	} else {
		window.history.replaceState({}, "", newURL);
	}
}
	
function renderCalendar(pushHistory = true) {

	const calendarDiv = document.getElementById("calendar");
	calendarDiv.innerHTML = "";

	// Ligne header des décades
	const headerRow = document.createElement("div");
	headerRow.classList.add("decade-header");

	decadeNames.forEach(name => {
		const div = document.createElement("div");
		div.classList.add("decade-cell");
		div.innerText = name;
		headerRow.appendChild(div);
	});

	calendarDiv.appendChild(headerRow);

	const todayDay = getRepublicanDay(currentRep.month, currentRep.day);
	let todayTitle = "";
	if (currentRep.month === 12) {
		todayTitle = todayDay.name + " - An " + viewYear;
	} else {
		todayTitle = currentRep.day + " " + republicanMonths[currentRep.month] + ", jour " + todayDay.article + todayDay.name + " - An " + viewYear;
	}

	let monthTitle = republicanMonths[viewMonth] + " - An " + viewYear;
	
	if(viewYear === currentRep.year && viewMonth === currentRep.month) {
		monthTitle = "Ce jour : " + todayTitle
	}

	document.title = `Calendrier Républicain - ${todayTitle}`;

	document.getElementById("monthTitle").innerText = monthTitle;

	const Ryme = Rymes[Math.floor(Math.random() * Rymes.length)];
	document.getElementById("footer").innerText = "Liberté • Égalité • " + Ryme;
	
	setURLParams(pushHistory);
	
	if (viewMonth === 12) {
		let maxDays = 5;
		if (viewYear % 4 === 0) maxDays = 6;

		for (let i = 1; i <= maxDays; i++) {
			const div = document.createElement("div");
			div.classList.add("day");

			if (viewYear === currentRep.year &&
				viewMonth === currentRep.month &&
				i === currentRep.day) {
				div.classList.add("today");
			}

			const dayData = getRepublicanDay(12, i);
			const moon = getMoonPhase(viewYear, viewMonth, i);
			
			div.innerHTML = `
				<a href="?dayR=${i}-${viewMonth}-${viewYear}"><div class="day-link"></div></a>
				<div class="day-number">${i}</div>
				<div class="moon">${moon}</div>
				<div class="ephemeride"><a href="https://fr.wikipedia.org/wiki/${dayData.wiki}">${dayData.name}</a></div>
			`;

			calendarDiv.appendChild(div);
		}
		return;
	}

	for (let i = 1; i <= 30; i++) {

		const div = document.createElement("div");
		div.classList.add("day");

		if (viewYear === currentRep.year &&
			viewMonth === currentRep.month &&
			i === currentRep.day) {
			div.classList.add("today");
		}
		
		if((i-1)%10 == 4) {
			div.classList.add("animal");
		}
		if((i-1)%10 == 9) {
			div.classList.add("outil");
		}

		const dayData = getRepublicanDay(viewMonth, i);

		const moon = getMoonPhase(viewYear, viewMonth, i);

		div.innerHTML = `
			<a href="?dayR=${i}-${viewMonth}-${viewYear}"><div class="day-link"></div></a>
			<div class="day-number">${i}</div>
			<div class="moon">${moon}</div>
			<div class="ephemeride"><a href="https://fr.wikipedia.org/wiki/${dayData.wiki}">${dayData.name}</a></div>
		`;
		
		calendarDiv.appendChild(div);
	}
}

function goToday() {
	todayDate = new Date();
	currentRep = gregorianToRepublican(todayDate);
	viewMonth = currentRep.month;
	viewYear = currentRep.year;
	renderCalendar();
}

function changeMonth(delta) {
	viewMonth += delta;

	if (viewMonth < 0) {
		viewMonth = 12;
		viewYear--;
	}
	if (viewMonth > 12) {
		viewMonth = 0;
		viewYear++;
	}

	renderCalendar();
}

readURLParams();
renderCalendar(false);
scrollToToday();

window.addEventListener("popstate", () => {
    readURLParams();
    renderCalendar(false);
});
