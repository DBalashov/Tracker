import AppDevice from './AppDevice';
import AppPeriod from './AppPeriod';
import AppMap from './AppMap';
import AppTimeline from './AppTimeline';

export default class App {
	private readonly serial: number;
	private readonly url: string;
	private readonly token: string;
	private readonly schemaID: string;
	private readonly refreshTime: number = 15000;
	private refreshTimeout: number = 0;
	private refreshActive: boolean = true;
	private id: string = '';
	private data: IEnumDevices = {};
	private device: AppDevice;
	private period: AppPeriod;
	private map: AppMap;
	private timeline: AppTimeline;

	constructor(config: any) {
		this.serial = +config.Settings.serial;
		this.url = config.Urls.Service + '/';
		this.token = config.Token;
		this.schemaID = config.Organization.UID;

		this.device = new AppDevice(config.Urls.ImageCar, (id: string) => this.onChangeDevice(id));

		this.period = new AppPeriod((sd: Date, ed: Date) => {
			const d = new Date();
			this.refreshActive = d.getFullYear() === ed.getFullYear() && d.getMonth() === ed.getMonth() && d.getDate() === ed.getDate();
			this.refreshTrack();
		});

		this.map = new AppMap(
			config.Urls.ImageCar,
			(id: string) => this.onChangeDevice(id),
			(d: Date) => {
				this.onChangePosition(d);
				this.timeline.setValue(d);
			}
		);

		this.timeline = new AppTimeline((d: Date) => {
			this.onChangePosition(d);
		});

		this.post('EnumDevices', { }, (r: IEnumDevicesResult) => {
			this.data = this.device.setData(r);
			const root: IDeviceItem = r.Groups.find((g: IDeviceItem) => g.ParentID === null) as IDeviceItem;
			this.onChangeDevice(root.ID);
		});
	}

	private onChangeDevice(id: string): void {
		this.message('notrack', false);

		if (this.id === id) return;

		const item = this.data[id];

		this.id = id;
		this.device.setDevice(item);

		if (typeof item.Serial === 'undefined') {
			this.device.locationDisable();
			this.period.disable();
			this.timeline.hide();
			this.refreshPosition();
		} else {
			this.device.locationEnable();
			this.period.enable();
			this.timeline.show();
			this.refreshTrack();
		}
	}

	private onChangePosition(d: Date): void {
		const info = this.map.moveMarker(d);
	}

	private refreshTrack(): void {
		const { sd, ed } = this.period.getDate();

		clearTimeout(this.refreshTimeout);

		this.post('GetTrack', {
			IDs: this.id,
			SD: this.fmtDT(sd),
			ED: this.fmtDT(ed),
			tripSplitterIndex: -1
		}, (r) => {
			if (r[this.id].length === 0 || ! r[this.id][0] || r[this.id][0].DT.length == 0) {
				this.map.clear();
				this.device.locationDisable();
				this.period.disable();
				this.timeline.hide();
				this.message('notrack', true, 'Нет данных');
				return;
			}

			const track = r[this.id][0];

			let lastTime = this.timeline.getValue();

			this.map.buildTrack(track, this.data[this.id], this.device.location);

			this.timeline.setData(track.DT);

			if (this.device.location || lastTime === null) {
				lastTime = new Date(track.DT[track.DT.length - 1]);
			}

			this.timeline.setValue(lastTime);

			if (this.refreshActive) {
				this.refreshTimeout = setTimeout(() => this.refreshTrack(), this.refreshTime);
			}
		});
	}

	private refreshPosition(): void {
		clearTimeout(this.refreshTimeout);

		this.post('GetOnlineInfo', {
			IDs: this.id
		}, (r) => {
			this.map.buildPositions(r, this.data, this.device.location);
			this.refreshTimeout = setTimeout(() => this.refreshPosition(), this.refreshTime);
		});
	}

	private fmtDT(d: Date) {
		const mm = d.getMonth() + 1;
		const dd = d.getDate();
		const hh = d.getHours();
		const mi = d.getMinutes();

		return d.getFullYear() + (mm > 9 ? '' : '0') + mm + (dd > 9 ? '' : '0') + dd + '-' + (hh > 9 ? '' : '0') + hh + (mi > 9 ? '' : '0') + mi;
	}

	private post(method: string, data: any, callback: (r: any) => void) {
		const formData = new FormData();

		for (let key in data) {
			formData.append(key, data[key]);
		}

		formData.append('session', this.token);
		formData.append('schemaID', this.schemaID);

		fetch(this.url + method, {
			method: 'POST',
			body: formData
		}).then((r) => r.json().then(callback)).catch((r) => console.error(r));
	}

	private message(id: string, show: boolean, message?: string): void {
		const m = document.querySelector('.message--' + id);

		if (m === null) return;

		m.classList[show ? 'add' : 'remove']('message--visible');

		m.innerHTML = message ? message : '';
	}
}

export interface IEnumDevicesResult {
	ID: string;
	Groups: IDeviceItem[];
	Items: IDeviceItem[];
}

export interface IDeviceItem {
	ID: string;
	ParentID: string | null;
	Name: string;
	Serial?: number;
	ImageColored?: string;
}

export interface IEnumDevices {
	[key: string]: IDeviceItem
}