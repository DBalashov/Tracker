export default class AppTimeline {
	private readonly container: HTMLElement;
	private readonly status: HTMLElement;
	private readonly cursorTop: HTMLElement;
	private readonly cursorMiddle: HTMLElement;
	private readonly cursorBottom: HTMLElement;
	private readonly dateContainer: HTMLElement;
	private readonly dateItemTemplate: HTMLTemplateElement;
	private times: Date[] = [];
	private value: Date | null = null;

	constructor(callback: (d: Date) => void) {
		this.container = document.querySelector('.timeline') as HTMLElement;
		this.status = this.container.querySelector('.timeline__status') as HTMLElement;
		this.cursorTop = this.container.querySelector('.timeline__cursor--top') as HTMLElement;
		this.cursorMiddle = this.container.querySelector('.timeline__cursor--middle') as HTMLElement;
		this.cursorBottom = this.container.querySelector('.timeline__cursor--bottom') as HTMLElement;
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
		this.cursorBottom.innerHTML = (day > 9 ? day : '0' + day) + '.' + (month > 9 ? month : '0' + month) + '.' + value.getFullYear();

		const width = this.status.clientWidth;
		const cursorTopHalf = (100 / (width / this.cursorTop.clientWidth)) / 2;
		const cursorBottomHalf = (100 / (width / this.cursorBottom.clientWidth)) / 2;
		let cursorTopLeft = left - cursorTopHalf;
		let cursorBottomLeft = left - cursorBottomHalf;

		if (cursorTopLeft < 0) {
			cursorTopLeft = 0;
		} else if (left + cursorTopHalf > 100) {
			cursorTopLeft = 100 - cursorTopHalf * 2;
		}

		if (cursorBottomLeft < 0) {
			cursorBottomLeft = 0;
		} else if (left + cursorBottomHalf > 100) {
			cursorBottomLeft = 100 - cursorBottomHalf * 2;
		}

		this.cursorTop.style.left = cursorTopLeft + '%';

		this.cursorBottom.style.left = cursorBottomLeft + '%';

		this.cursorMiddle.style.left = left + '%';
	}

	public show(): void {
		this.container.classList.add('timeline--visible');
	}

	public hide(): void {
		this.container.classList.remove('timeline--visible');
	}

	public setData(times: string[]): void {
		this.times = times.map((t) => new Date(t));

		const minDateWidth = 100 / (this.status.clientWidth / 45); // 45px
		const minTime = this.times[0].getTime();
		const maxTime = this.times[this.times.length - 1].getTime();
		const period =  maxTime - minTime;

		this.dateContainer.innerHTML = '';

		let info: any = {};

		this.times.forEach((item: Date, i: number) => {
			const day = item.getDate();
			const month = item.getMonth();
			const d = (day > 9 ? day : '0' + day) + '.' + (month > 9 ? month : '0' + month) + '.' + item.getFullYear();

			info[d] = 100 / (period / (item.getTime() - minTime));
		});

		let prev = 0;
		for (let d in info) {
			const htmlElement: HTMLElement = this.dateItemTemplate.content.cloneNode(true) as HTMLElement;

			this.dateContainer.appendChild(htmlElement);

			const element = this.dateContainer.lastChild as HTMLElement;
			const w = info[d] - prev;

			prev = info[d];

			element.innerHTML = w > minDateWidth ? d : '';
			element.style.width = w + '%';
		}
	}

	public setValue(value: Date): void {
		const offset = value.getTime() - this.times[0].getTime();
		const period = this.times[this.times.length - 1].getTime() - this.times[0].getTime();
		const d = period / offset;

		this.value = value;

		this.setCursor(value, 100 / d);
	}

	public getValue(): Date | null {
		return this.value;
	}
}