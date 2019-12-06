import AppDevice from './AppDevice';
import AppPeriod from './AppPeriod';
import AppMap from './AppMap';
import AppTimeline from './AppTimeline';

export default class App {
	private readonly serial: number;
	private readonly url: string;
	private readonly token: string;
	private readonly schemaID: string;
	private id: string = '';
	private device: AppDevice;
	private period: AppPeriod;
	private map: AppMap;

	constructor(config: any) {
		this.serial = +config.Settings.serial;
		this.url = config.Urls.Service + '/';
		this.token = config.Token;
		this.schemaID = config.Organization.UID;

		this.device = new AppDevice();

		this.period = new AppPeriod((sd: Date, ed: Date) => {
			this.refresh();
		});

		this.map = new AppMap();

		this.post('EnumDevices', { }, (r: IEnumDevicesResult) => {
			this.device.setData(r);

			// ---

			const item = r.Items.find((i: any) => i.Serial === this.serial);

			if ( ! item) {
				console.error('Serial number not found');
				return;
			}

			this.id = item.ID;

			this.refresh();
		});
	}

	private refresh(): void {
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
				console.warn('Нет данных');
				return;
			}

			this.map.buildTrack(track);
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