import { IEnumDevicesResult, IDeviceItem } from './App';

export default class AppDevice {
	private readonly containerControl: HTMLElement;
	private readonly containerTree: HTMLElement;
	private readonly templateItem: HTMLTemplateElement;

	constructor() {
		const devicePopup: HTMLElement = document.querySelector('.device__popup') as HTMLElement;

		this.containerControl = document.querySelector('.device__control') as HTMLElement;

		(<HTMLSelectElement>this.containerControl).addEventListener('click', () => devicePopup.classList.toggle('device__popup--open'));

		this.containerTree = document.querySelector('.device__tree') as HTMLElement;

		this.templateItem = document.getElementById('device__item-template') as HTMLTemplateElement;
	}

	private createPopup(parentID: string, data: any, level: number): void {
		if (typeof data[parentID] === 'undefined') return;

		data[parentID].forEach((item: IDeviceItem) => {
			const htmlElement: HTMLElement = this.templateItem.content.cloneNode(true) as HTMLElement;

			this.setElementData(htmlElement, item, level);

			this.containerTree.appendChild(htmlElement);

			this.createPopup(item.ID, data, level + 1);
		});
	}

	private setElementData(element: HTMLElement, item: IDeviceItem, level: number): void {
		const imageElement: HTMLElement = element.querySelector('.device__item-image') as HTMLElement;
		const nameElement: HTMLElement = element.querySelector('.device__item-name') as HTMLElement;

		if (typeof item.Serial === 'undefined') {
			imageElement.classList.add('device__item-image--folder');
		} else {
			imageElement.style.backgroundImage = 'url(' + item.ImageColored + ')';
		}

		nameElement.innerHTML = item.Name;

		imageElement.style.marginLeft = (10 * level) + 'px';
	}

	public setData(r: IEnumDevicesResult): void {
		const data: any = {
			'null': []
		};

		r.Groups.concat(r.Items).forEach((item: any) => {
			if (typeof data[item.ParentID] === 'undefined') {
				data[item.ParentID] = [];
			}

			data[item.ParentID].push(item);
		});

		this.setElementData(this.containerControl, data['null'][0], 0);

		this.createPopup('null', data, 0);
	}
}