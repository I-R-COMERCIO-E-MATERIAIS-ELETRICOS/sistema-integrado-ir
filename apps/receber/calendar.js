// ============================================
// CALENDAR - Contas a Receber
// ============================================
let calendarYear = new Date().getFullYear();
const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

window.toggleCalendar = function () {
    const modal = document.getElementById('calendarModal');
    if (!modal) return;
    if (modal.classList.contains('show')) modal.classList.remove('show');
    else { renderCalendarMonths(); modal.classList.add('show'); }
};

window.changeCalendarYear = function (direction) {
    calendarYear += direction;
    const yEl = document.getElementById('calendarYear');
    if (yEl) yEl.textContent = calendarYear;
    renderCalendarMonths();
};

function renderCalendarMonths() {
    const container = document.getElementById('calendarMonths');
    if (!container) return;
    container.innerHTML = '';
    const hoje = new Date();
    mesesNomes.forEach((mes, index) => {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'calendar-month';
        monthDiv.textContent = mes;
        if (calendarYear === hoje.getFullYear() && index === hoje.getMonth()) monthDiv.classList.add('current');
        monthDiv.onclick = () => selectMonth(index);
        container.appendChild(monthDiv);
    });
}

function selectMonth(monthIndex) {
    if (typeof currentMonth !== 'undefined') {
        currentMonth = monthIndex;
        if (typeof currentYear !== 'undefined') currentYear = calendarYear;
        if (typeof updateMonthDisplay === 'function') updateMonthDisplay();
    }
    window.toggleCalendar();
}

document.addEventListener('click', function (e) {
    const modal = document.getElementById('calendarModal');
    if (modal && e.target === modal) window.toggleCalendar();
});
