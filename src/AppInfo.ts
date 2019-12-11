export default class AppInfo {
	private readonly distUnit: string = 'км';
	private readonly speedUnit: string = 'км/ч';
	private readonly dist: HTMLElement;
	private readonly speed: HTMLElement;

	constructor() {
		this.dist = document.querySelector('.info__dist') as HTMLElement;
		this.speed = document.querySelector('.info__speed') as HTMLElement;
	}

	public update(distance: number, speed: number): void {
		this.dist.innerHTML = Math.round(distance / 1000).toLocaleString() + ' ' + this.distUnit;
		this.speed.innerHTML = Math.round(speed) + ' ' + this.speedUnit;
	}
}