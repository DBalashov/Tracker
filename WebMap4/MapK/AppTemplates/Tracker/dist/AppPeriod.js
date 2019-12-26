export default class AppPeriod {
    constructor(callback) {
        this.sd = new Date();
        this.ed = new Date();
        this.callback = callback;
        this.fieldset = document.querySelector('.period__fieldset');
        const periodDown = document.querySelector('.period__control--down');
        const periodUp = document.querySelector('.period__control--up');
        const periodDateStart = document.querySelector('.period__date--start');
        const periodDateEnd = document.querySelector('.period__date--end');
        this.sd.setHours(0, 0, 0, 0);
        this.ed.setHours(23, 59, 59, 999);
        periodDateStart.setAttribute('max', this.dateToValue(this.ed));
        periodDateEnd.setAttribute('max', this.dateToValue(this.ed));
        periodDateStart.value = this.dateToValue(this.sd);
        periodDateEnd.value = this.dateToValue(this.ed);
        // ---
        periodDown.addEventListener('click', () => this.onClickPeriodSlide(-1, periodDateStart, periodDateEnd));
        periodUp.addEventListener('click', () => this.onClickPeriodSlide(1, periodDateStart, periodDateEnd));
        periodDateStart.addEventListener('change', () => this.onChangePeriod(periodDateStart, periodDateEnd));
        periodDateEnd.addEventListener('change', () => this.onChangePeriod(periodDateStart, periodDateEnd));
    }
    onClickPeriodSlide(d, sdElement, edElement) {
        const sd = new Date(sdElement.value);
        const ed = new Date(edElement.value);
        const max = new Date();
        sd.setDate(sd.getDate() + d);
        ed.setDate(ed.getDate() + d);
        if (d > 0) {
            if (sd.getTime() > max.getTime()) {
                sd.setDate(max.getDate());
                sd.setHours(0, 0, 0, 0);
            }
            if (ed.getTime() > max.getTime()) {
                ed.setDate(max.getDate());
                ed.setHours(23, 59, 59, 999);
            }
        }
        sdElement.value = this.dateToValue(sd);
        edElement.value = this.dateToValue(ed);
        this.sd = sd;
        this.ed = ed;
        this.callback(sd, ed);
    }
    onChangePeriod(sdElement, edElement) {
        const sd = new Date(sdElement.value);
        const ed = new Date(edElement.value);
        this.sd = sd;
        this.ed = ed;
        // check dates
        this.callback(sd, ed);
    }
    dateToValue(d) {
        const mm = d.getMonth() + 1;
        const dd = d.getDate();
        const h = d.getHours();
        const m = d.getMinutes();
        const strDate = [d.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('-');
        const strTime = 'T' + (h > 9 ? '' : '0') + h + ':' + (m > 9 ? '' : '0') + m;
        return strDate + strTime;
    }
    getDate() {
        return {
            sd: this.sd,
            ed: this.ed
        };
    }
    disable() {
        this.fieldset.setAttribute('disabled', 'true');
    }
    enable() {
        this.fieldset.removeAttribute('disabled');
    }
}
//# sourceMappingURL=AppPeriod.js.map