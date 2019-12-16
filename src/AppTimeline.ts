export default class AppTimeline {
	private readonly container: HTMLElement;
	private readonly status: HTMLElement;
	private readonly cursorTop: HTMLElement;
	private readonly cursorMiddle: HTMLElement;
	private readonly dateContainer: HTMLElement;
	private readonly dateItemTemplate: HTMLTemplateElement;
	private times: Date[] = [];
	private value: Date | null = null;

	constructor(callback: (d: Date) => void) {
		this.container = document.querySelector('.timeline') as HTMLElement;
		this.status = this.container.querySelector('.timeline__status') as HTMLElement;
		this.cursorTop = this.container.querySelector('.timeline__cursor--top') as HTMLElement;
		this.cursorMiddle = this.container.querySelector('.timeline__cursor--middle') as HTMLElement;
		this.dateContainer = this.container.querySelector('.timeline__date') as HTMLElement;
		this.dateItemTemplate = document.getElementById('timeline__date-item-template') as HTMLTemplateElement;

		this.status.addEventListener('click', (e) => {
			const width = (e.target as HTMLElement).clientWidth;
			const offset = e.offsetX;
			const d = width / offset;
			const period = this.times[this.times.length - 1].getTime() - this.times[0].getTime();

			(this.value as Date).setTime(this.times[0].getTime() + period / d);
			this.setCursor(this.value as Date, 100 / d);
			callback(this.value as Date);
		});
	}

	private setCursor(value: Date, left: number): void {
		const day = value.getDate();
		const month = value.getMonth();
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

	public setData(times: string[], speed: number[]): void {
		this.times = times.map((t) => new Date(t));

		const minTime = this.times[0].getTime();
		const maxTime = this.times[this.times.length - 1].getTime();
		const period =  maxTime - minTime;

		// --- Dates ---

		this.dateContainer.innerHTML = '';

		let info: any = {};

		this.times.forEach((item: Date) => {
			const day = item.getDate();
			const month = item.getMonth();
			const d = (day > 9 ? day : '0' + day) + '.' + (month > 9 ? month : '0' + month) + '.' + item.getFullYear();
			info[d] = item.getTime();
		});

		let startTime = minTime;
		let n = Object.keys(info).length - 1;
		let i = 0;

		for (let d in info) {
			const htmlElement: HTMLElement = this.dateItemTemplate.content.cloneNode(true) as HTMLElement;
			this.dateContainer.appendChild(htmlElement);
			const element = this.dateContainer.lastChild as HTMLElement;
			// ---
			const dt = new Date();
			dt.setTime(info[d]);
			// ---
			if (i > 0) {
				dt.setHours(0,0,0,0);
				startTime = dt.getTime();
			}
			// ---
			let endTime = info[d];
			if (i !== n) {
				dt.setHours(23,59,59,999);
				endTime = dt.getTime();
			}
			// ---
			element.innerHTML = d;
			element.style.width = (100 / (period / (endTime - startTime))) + '%';
			// ---
			i++;
		}

		// --- Stops ---

		startTime = minTime;

		const gradients: string[] = [];
		let currentWidth = 0;
		let prevPosition = 0;
		let stops: number[][] = [];

		speed = speed.map((s) => Math.round(s));

		for (let i = 0; i < speed.length - 1; i++) {
			let endTime = this.times[i + 1].getTime();

			currentWidth = 100 / (period / (endTime - startTime));

			if (speed[i] === 0 && speed[i + 1] === 0 || speed[i] !== 0 && speed[i + 1] !== 0) {
				continue;
			}

			if (speed[i] === 0) {
				stops.push([prevPosition, currentWidth]);
			}

			startTime = endTime;
			prevPosition += currentWidth;
		}

		if (stops.length > 0 && speed[speed.length - 1] === 0) {
			stops.push([prevPosition, currentWidth]);
		}

		stops.forEach((d) => {
			this.status.innerHTML += '<i style="left: ' + d[0] + '%; width: ' + d[1] + '%;"></i>';
		});
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