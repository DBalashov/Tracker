import { IEnumDevicesResult, IDeviceItem, IEnumDevices } from './App';

export default class AppDevice {
	private readonly devicePopup: HTMLElement;
	private readonly containerControl: HTMLElement;
	private readonly containerTree: HTMLUListElement;
	private readonly containerInfo: HTMLElement;
	private readonly templateItem: HTMLTemplateElement;
	private readonly locationControl: HTMLButtonElement;
	private readonly urlImage: string;
	private readonly nameFolder: string = '(folder)';
	private readonly callback: (id: string) => void;
	private id: string = '';
	public location: boolean = true;

	constructor(urlImage: string, callback: (id: string) => void) {
		this.devicePopup = document.querySelector('.device__popup') as HTMLElement;

		this.containerControl = document.querySelector('.device__control') as HTMLElement;

		(<HTMLSelectElement>this.containerControl).addEventListener('click', () => this.devicePopup.classList.toggle('device__popup--open'));

		this.containerInfo = document.querySelector('.device__info') as HTMLElement;

		this.containerTree = document.querySelector('.device__tree') as HTMLUListElement;

		this.templateItem = document.getElementById('device__item-template') as HTMLTemplateElement;

		this.locationControl = (document.querySelector('.device__location-control') as HTMLButtonElement);

		this.locationControl.addEventListener('click', (e) => {
			this.location = ! this.location;
			(e.currentTarget as HTMLButtonElement).classList.toggle('device__location-control--active');

			if (this.location) {
				callback(this.id);
			}
		});

		this.urlImage = urlImage;

		this.callback = callback;

		document.addEventListener('click', (e) => {
			if ( ! this.containerControl.contains(e.target as HTMLElement) && ! this.devicePopup.contains(e.target as HTMLElement)) {
				this.devicePopup.classList.remove('device__popup--open');
			}
		});
	}

	private createPopup(parentID: string, data: IEnumDevicesTree, level: number): void {
		if (typeof data[parentID] === 'undefined') return;

		data[parentID].forEach((item: IDeviceItem) => {
			const htmlElement: HTMLElement = this.templateItem.content.cloneNode(true) as HTMLElement;

			this.setElementData(htmlElement, item, level);

			this.containerTree.appendChild(htmlElement);

			const child = this.containerTree.querySelectorAll('.device__item');

			child[child.length - 1].addEventListener('click', () => {
				this.devicePopup.classList.remove('device__popup--open');
				this.callback(item.ID);
			});

			this.createPopup(item.ID, data, level + 1);
		});
	}

	private setElementData(element: HTMLElement, item: IDeviceItem, level: number): void {
		const imageElement: HTMLImageElement = element.querySelector('.device__item-image img') as HTMLImageElement;
		const nameElement: HTMLElement = element.querySelector('.device__item-name') as HTMLElement;

		imageElement.src = this.urlImage + '/' + (typeof item.Serial === 'undefined' ? this.nameFolder : item.ImageColored);

		nameElement.innerHTML = item.Name;

		(imageElement.parentElement as HTMLElement).style.marginLeft = (10 * level) + 'px';
	}

	public setData(r: IEnumDevicesResult): IEnumDevices {
		const result: IEnumDevices = {};
		const data: IEnumDevicesTree = {
			'null': []
		};

		r.Groups.concat(r.Items).forEach((item: any) => {
			if (typeof data[item.ParentID] === 'undefined') {
				data[item.ParentID] = [];
			}

			data[item.ParentID].push(item);

			result[item.ID] = item;
		});

		this.createPopup('null', data, 0);

		return result;
	}

	public setDevice(item: IDeviceItem): void {
		this.id = item.ID;
		this.setElementData(this.containerControl, item, 0);
	}
}

interface IEnumDevicesTree {
	[key: string]: IDeviceItem[]
}