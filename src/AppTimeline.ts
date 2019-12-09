export default class AppTimeline {
	private readonly container: HTMLElement;
	private readonly status: HTMLElement;
	private readonly cursor: HTMLElement;
	private times: Date[] = [];
	private value: Date = new Date();

	constructor(callback: (d: Date) => void) {
		this.container = document.querySelector('.timeline') as HTMLElement;
		this.status = this.container.querySelector('.timeline__status') as HTMLElement;
		this.cursor = this.container.querySelector('.timeline__cursor') as HTMLElement;

		this.status.addEventListener('click', (e) => {
			const width = (e.target as HTMLElement).clientWidth;
			const offset = e.offsetX;
			const d = width / offset;
			const period = this.times[this.times.length - 1].getTime() - this.times[0].getTime();

			this.value.setTime(this.times[0].getTime() + period / d);
			this.cursor.style.left = (100 / d) + '%';
			callback(this.value);
		});
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
		this.cursor.style.left = (100 / d) + '%';
	}
}