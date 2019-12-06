export default class AppPeriod {
	private sd: Date = new Date();
	private ed: Date = new Date();
	private callback: (sd: Date, ed: Date) => void;

	constructor(callback: (sd: Date, ed: Date) => void) {
		this.callback = callback;
		const periodDown: HTMLElement = document.querySelector('.period__control--down') as HTMLElement;
		const periodUp: HTMLElement = document.querySelector('.period__control--up') as HTMLElement;
		const periodDateStart: HTMLInputElement = document.querySelector('.period__date--start') as HTMLInputElement;
		const periodDateEnd: HTMLInputElement = document.querySelector('.period__date--end') as HTMLInputElement;

		this.sd.setHours(0,0,0,0);
		this.ed.setHours(23,59,59,999);

		periodDateStart.setAttribute('max', this.dateToValue(this.ed));
		periodDateEnd.setAttribute('max', this.dateToValue(this.ed));

		periodDateStart.value = this.dateToValue(this.sd);
		periodDateEnd.value = this.dateToValue(this.ed);

		// ---

		(<HTMLElement>periodDown).addEventListener('click', () => this.onClickPeriodSlide(-1, periodDateStart, periodDateEnd));
		(<HTMLElement>periodUp).addEventListener('click', () => this.onClickPeriodSlide(1, periodDateStart, periodDateEnd));
		(<HTMLElement>periodDateStart).addEventListener('change', () => this.onChangePeriod(periodDateStart, periodDateEnd));
		(<HTMLElement>periodDateEnd).addEventListener('change', () => this.onChangePeriod(periodDateStart, periodDateEnd));
	}

	private onClickPeriodSlide(d: number, sdElement: HTMLInputElement, edElement: HTMLInputElement): void {
		const sd = new Date(sdElement.value);
		const ed = new Date(edElement.value);
		const max = new Date();

		sd.setDate(sd.getDate() + d);
		ed.setDate(ed.getDate() + d);

		if (d > 0) {
			if (sd.getTime() > max.getTime()) {
				sd.setDate(max.getDate());
				sd.setHours(0,0,0,0);
			}
			if (ed.getTime() > max.getTime()) {
				ed.setDate(max.getDate());
				ed.setHours(23,59,59,999);
			}
		}

		sdElement.value = this.dateToValue(sd);
		edElement.value = this.dateToValue(ed);

		this.sd = sd;
		this.ed = ed;

		this.callback(sd, ed);
	}

	private onChangePeriod(sdElement: HTMLInputElement, edElement: HTMLInputElement) {
		const sd = new Date(sdElement.value);
		const ed = new Date(edElement.value);

		this.sd = sd;
		this.ed = ed;

		// check dates

		this.callback(sd, ed);
	}

	private dateToValue(d: Date): string {
		const mm = d.getMonth() + 1;
		const dd = d.getDate();
		const h = d.getHours();
		const m = d.getMinutes();

		const strDate = [d.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('-');
		const strTime = 'T' + (h > 9 ? '' : '0') + h + ':' + (m > 9 ? '' : '0') + m;

		return strDate + strTime;
	}

	public getDate(): IPeriod {
		return {
			sd: this.sd,
			ed: this.ed
		};
	}
}

interface IPeriod {
	sd: Date;
	ed: Date;
}