export class App {
	private readonly serial: number;
	private readonly url: string;
	private readonly token: string;
	private readonly schemaID: string;
	private id: number = 0;
	private sd: Date = new Date();
	private ed: Date = new Date();

	constructor(config: any) {
		this.serial = config.Settings.serial;
		this.url = config.Urls.Service + '/';
		this.token = config.Token;
		this.schemaID = config.Organization.UID;

		this.initPeriod();
		this.initTimeline();
	}

	private initPeriod(): void {
		const periodDown: HTMLElement | null = document.querySelector('.period__control--down');
		const periodUp = document.querySelector('.period__control--up');
		const periodDate = document.querySelector('.period__date');

		//(<HTMLElement>periodDown).addEventListener('click', () => this.onClickPeriodSlide(-1, periodDate));
		//(<HTMLElement>periodUp).addEventListener('click', () => this.onClickPeriodSlide(1, periodDate));
		//(<HTMLElement>periodDate).addEventListener('change', (e) => this.onChangePeriod(e.target.value));
		//(<HTMLInputElement>periodDate).value = this.periodDT(this.currentDate);
		//(<HTMLElement>periodDate).setAttribute('max', this.periodDT(new Date()));
	}

	private initTimeline(): void {

	}
/*
	onClickPeriodSlide(d, periodDate) {
		if (this.periodDT(this.currentDate) == periodDate.getAttribute('max') && d > 0) {
			return;
		}

		this.currentDate.setDate(this.currentDate.getDate() + d);
		periodDate.value = this.periodDT(this.currentDate);
		this.changeDate();
	}

	onChangePeriod(value) {
		this.currentDate = new Date(value);
		this.changeDate();
	}

	changeDate() {
		const sd = new Date(this.currentDate.getTime());
		const ed = new Date(this.currentDate.getTime());

		sd.setHours(0,0,0,0);
		ed.setHours(23,59,59,999);

		this.layerCar.clearLayers();

		this.message('notrack', false);

		this.post('GetTrack', {
			IDs: this.id,
			SD: this.fmtDT(sd),
			ED: this.fmtDT(ed),
			tripSplitterIndex: -1
		}, (r) => {
			const track = r[this.id][0];
			const bounds = L.latLngBounds([]);

			if ( ! track || track.DT.length == 0) {
				this.message('notrack', true, 'Нет данных');
				return;
			}

			for (let i = 0; i < track.Lat.length; i++) {
				const t = Date.parse(track.DT[i]);
				const d = new Date(t);
				const coord = L.latLng(track.Lat[i], track.Lng[i]);

				this.buildBarker(coord, d, i + 1);

				bounds.extend(coord);
			}

			if (bounds.isValid()) {
				this.map.fitBounds(bounds, { padding: [100, 100] });
			}
		});
	}
*/
	private periodDT(d: Date) {
		const mm = d.getMonth() + 1;
		const dd = d.getDate();

		return [d.getFullYear(), (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('-');
	}

	private fmtDT(d: Date) {
		const mm = d.getUTCMonth() + 1;
		const dd = d.getUTCDate();
		const hh = d.getUTCHours();
		const mi = d.getUTCMinutes();

		return d.getUTCFullYear() + (mm > 9 ? '' : '0') + mm + (dd > 9 ? '' : '0') + dd + '-' + (hh > 9 ? '' : '0') + hh + (mi > 9 ? '' : '0') + mi;
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