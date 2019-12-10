export default class AppTimeline {
	private readonly container: HTMLElement;
	private readonly status: HTMLElement;
	private readonly cursorTop: HTMLElement;
	private readonly cursorMiddle: HTMLElement;
	private readonly cursorBottom: HTMLElement;
	private times: Date[] = [];
	private value: Date | null = null;

	constructor(callback: (d: Date) => void) {
		this.container = document.querySelector('.timeline') as HTMLElement;
		this.status = this.container.querySelector('.timeline__status') as HTMLElement;
		this.cursorTop = this.container.querySelector('.timeline__cursor--top') as HTMLElement;
		this.cursorMiddle = this.container.querySelector('.timeline__cursor--middle') as HTMLElement;
		this.cursorBottom = this.container.querySelector('.timeline__cursor--bottom') as HTMLElement;

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

		const max = this.status.clientWidth;

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