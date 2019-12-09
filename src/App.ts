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
	private refreshInterval: number = 0;
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
		this.period = new AppPeriod(() => this.refreshTrack());
		this.map = new AppMap(config.Urls.ImageCar, (id: string) => this.onChangeDevice(id));
		this.timeline = new AppTimeline((d: Date) => this.onChangePosition());

		this.post('EnumDevices', { }, (r: IEnumDevicesResult) => {
			this.data = this.device.setData(r);
			const root: IDeviceItem = r.Groups.find((g: IDeviceItem) => g.ParentID === null) as IDeviceItem;
			this.onChangeDevice(root.ID);
		});
	}

	private onChangeDevice(id: string): void {
		if (this.id === id) return;

		const item = this.data[id];

		this.id = id;
		this.device.setDevice(item);

		if (typeof item.Serial === 'undefined') {
			this.timeline.hide();
			this.refreshPosition();
		} else {
			this.timeline.show();
			this.refreshTrack();
		}

		clearInterval(this.refreshInterval);

		this.refreshInterval = setInterval(() => {
			if (typeof item.Serial === 'undefined') {
				this.refreshPosition();
			} else {
				this.refreshTrack();
			}
		}, this.refreshTime);
	}

	private onChangePosition(): void {

	}

	private refreshTrack(): void {
		const { sd, ed } = this.period.getDate();

		this.post('GetTrack', {
			IDs: this.id,
			SD: this.fmtDT(sd),
			ED: this.fmtDT(ed),
			tripSplitterIndex: -1
		}, (r) => {
			const track = r[this.id][0];

			if ( ! track || track.DT.length == 0) {
				this.map.clear();
				this.timeline.hide();
				clearInterval(this.refreshInterval);
				console.warn('Нет данных');
				return;
			}

			this.map.buildTrack(track, this.data[this.id]);
			this.timeline.setData(track.DT);

			// if watch location
			this.timeline.setValue(new Date(track.DT[track.DT.length - 1]));
		});
	}

	private refreshPosition(): void {
		this.post('GetOnlineInfo', {
			IDs: this.id
		}, (r) => {
			this.map.buildPositions(r, this.data)
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