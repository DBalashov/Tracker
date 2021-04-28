import {EventBus} from "../../mobi/src/app";

export default class AppTimeline {
	private readonly container: HTMLElement;
	private readonly status: HTMLElement;
	private readonly cursorTop: HTMLElement;
	private readonly cursorMiddle: HTMLElement;
	private readonly dateContainer: HTMLElement;
	private readonly dateItemTemplate: HTMLTemplateElement;
	private readonly statusItemTemplate: HTMLTemplateElement;
	private times: Date[] = [];
	private value: Date | null = null;

	constructor(callback: (d: Date) => void) {
		this.container = document.querySelector('.timeline') as HTMLElement;
		this.status = this.container.querySelector('.timeline__status') as HTMLElement;
		this.cursorTop = this.container.querySelector('.timeline__cursor--top') as HTMLElement;
		this.cursorMiddle = this.container.querySelector('.timeline__cursor--middle') as HTMLElement;
		this.dateContainer = this.container.querySelector('.timeline__date') as HTMLElement;
		this.dateItemTemplate = document.getElementById('timeline__date-item-template') as HTMLTemplateElement;
		this.statusItemTemplate = document.getElementById('timeline__status-item-template') as HTMLTemplateElement;

		this.status.addEventListener('click', (e) => {
			const rectParent = this.status.getBoundingClientRect();
			const sd = this.times[0];
			const ed = this.times[this.times.length - 1];
			const k = rectParent.width / (e.x - rectParent.x);
			const d = new Date(sd.getTime() + (ed.getTime() - sd.getTime()) / k);

			(this.value as Date).setTime(d.getTime());
			this.setCursor(this.value as Date, 100 / k);
			callback(this.value as Date);
		});
	}

	private setCursor(value: Date, left: number): void {
		const hh = value.getHours();
		const mm = value.getMinutes();
		const ss = value.getSeconds();

		this.cursorTop.innerHTML = (hh > 9 ? hh : '0' + hh) + ':' + (mm > 9 ? mm : '0' + mm) + ':' + (ss > 9 ? ss : '0' + ss);

		const width = this.status.clientWidth;
		const cursorTopHalf = (100 / (width / this.cursorTop.clientWidth)) / 2;
		let cursorTopLeft = left - cursorTopHalf;

		if (cursorTopLeft < 0) {
			cursorTopLeft = 0;
		} else if (left + cursorTopHalf > 100) {
			cursorTopLeft = 100 - cursorTopHalf * 2;
		}

		this.cursorTop.style.left = cursorTopLeft + '%';

		this.cursorMiddle.style.left = left + '%';
	}

	public show(): void {
		this.container.classList.add('timeline--visible');
	}

	public hide(): void {
		this.container.classList.remove('timeline--visible');
	}

	public setData(times: string[], speedData: number[]): void {
		this.times = times.map((t) => new Date(t));

		const speed = speedData.map((s: number) => Math.round(s));
		const minTime = this.times[0].getTime();
		const maxTime = this.times[this.times.length - 1].getTime();
		const period =  maxTime - minTime;
		const formatDt = (d: Date) => {
			const day = d.getDate();
			const month = d.getMonth() + 1;
			return (day > 9 ? day : '0' + day) + '.' + (month > 9 ? month : '0' + month) + '.' + d.getFullYear();
		};
		const dateWidth: {[key: string]: number} = {};
		const dateStops: {[key: string]: number[][]} = {};
		const dateMoves: {[key: string]: number[][]} = {};
		const info: { [key: string]: { sd: number; ed: number } } = {};

		// --- Dates ---

		const n = times.length - 1;
		const start = new Date();
		let itemSd = minTime;
		for (let i = 0; i < n; i++) {
			const item = this.times[i];
			const itemNext = this.times[i + 1];
			const itemDt = formatDt(item);
			const itemNextDt = formatDt(itemNext);

			if (itemDt == itemNextDt) {
				info[itemDt] = {
					sd: itemSd,
					ed: item.getTime()
				};
			} else {
				const end = new Date(item.getTime());
				end.setHours(23,59,59,999);
				info[itemDt] = {
					sd: itemSd,
					ed: end.getTime()
				};
				// ---
				start.setTime(itemNext.getTime());
				start.setHours(0,0,0,0);
				itemSd = start.getTime();
				// ---
				const oneDay = 24 * 60 * 60 * 1000;
				const days = (itemNext.getTime() - end.getTime()) / oneDay;
				for (let j = 0; j < days; j++) {
					end.setTime(end.getTime() + oneDay);
					start.setTime(end.getTime());
					start.setHours(0,0,0,0);
					info[formatDt(end)] = {
						sd: start.getTime(),
						ed: end.getTime()
					};
				}
			}
		}
		if (Object.keys(info).length == 1) {
			info[formatDt(this.times[n])] = {
				sd: minTime,
				ed: maxTime
			};
		} else {
			start.setTime(maxTime);
			start.setHours(0, 0, 0, 0);
			info[formatDt(this.times[n])] = {
				sd: start.getTime(),
				ed: maxTime
			};
		}

		let k = 0;

		for (const d in info) {
			const periodItem = info[d].ed - info[d].sd;
			// ---
			dateWidth[d] = 100 / (period / periodItem);
			dateStops[d] = [];
			dateMoves[d] = [];

			// --- Stops / Moves ---
			let currentWidth = 0;
			let prevPosition = 0;
			let startKtime = info[d].sd;
			k++;
			for ( ; this.times[k] && this.times[k].getTime() <= info[d].ed; k++) {
				const endKtime = this.times[k].getTime();

				currentWidth = 100 / (periodItem / (endKtime - startKtime));

				if (speed[k - 1] === 0 && speed[k] === 0 || speed[k - 1] !== 0 && speed[k] !== 0) {
					continue;
				}

				if (speed[k - 1] === 0) {
					dateStops[d].push([prevPosition, currentWidth]);
				} else {
					dateMoves[d].push([prevPosition, currentWidth]);
				}

				startKtime = endKtime;
				prevPosition += currentWidth;
			}

			if (speed[k - 1] === 0) {
				dateStops[d].push([prevPosition, currentWidth]);
			} else {
				dateMoves[d].push([prevPosition, currentWidth]);
			}
		}

		this.dateContainer.innerHTML = '';
		this.status.innerHTML = '';

		for (const d in dateWidth) {
			const htmlElement: HTMLElement = this.dateItemTemplate.content.cloneNode(true) as HTMLElement;
			this.dateContainer.appendChild(htmlElement);
			const element = this.dateContainer.lastChild as HTMLElement;
			element.innerHTML = d;
			element.style.width = dateWidth[d] + '%';

			// ---

			const statusItemElement: HTMLElement = this.statusItemTemplate.content.cloneNode(true) as HTMLElement;
			this.status.appendChild(statusItemElement);
			const statusElement = this.status.lastChild as HTMLElement;

			statusElement.style.width = dateWidth[d] + '%';
			dateStops[d].forEach((i) => statusElement.innerHTML += '<i class="timeline__status-stop" style="left: ' + i[0] + '%; width: ' + i[1] + '%;"></i>');
			dateMoves[d].forEach((i) => statusElement.innerHTML += '<i class="timeline__status-move" style="left: ' + i[0] + '%; width: ' + i[1] + '%;"></i>');
		}
	}

	public setValue(value: Date | null): void {
		this.value = value;

		if (value === null) return;

		const offset = value.getTime() - this.times[0].getTime();
		const period = this.times[this.times.length - 1].getTime() - this.times[0].getTime();
		const d = period / offset;

		this.setCursor(value, 100 / d);
	}

	public getValue(): Date | null {
		return this.value;
	}
}
