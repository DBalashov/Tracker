import AppMap from "@/AppMap";

export default class AppLayers {
	private readonly select: HTMLSelectElement;
	private static readonly mapLang: string = 'ru-RU';
	private readonly layers: ILayerConfig[] = [
		{ name: '2GIS', url: '//tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', opt: { subdomains: '0123', maxZoom: 18 } },
		{ name: 'OSM', url: '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', opt: { subdomains: 'abc', maxZoom: 19 } },
		{ name: 'Google', url: '//mts{s}.google.com/vt/hl=' + AppLayers.mapLang + '&x={x}&y={y}&z={z}', opt: { subdomains: "0123" } },
		{ name: 'Google satellite', url: '//khm{s}.google.com/kh/v=840&hl=' + AppLayers.mapLang + '&x={x}&y={y}&z={z}', opt: { subdomains: "01" } },
		{ name: 'Yandex', url: '//vec{s}.maps.yandex.net/tiles?l=map&v=18.12.13-0&z={z}&x={x}&y={y}&scale=2&lang=' + AppLayers.mapLang.replace('-', '_'), opt: { subdomains: ['01', '02', '03', '04'] } },
		{ name: 'Yandex satellite', url: '//sat{s}.maps.yandex.net/tiles?l=sat&v=3.448.0&z={z}&x={x}&y={y}&lang=' + AppLayers.mapLang.replace('-', '_'), opt: { subdomains: ['01', '02', '03', '04'] } }
	];

	constructor(map: AppMap) {
		this.select = document.querySelector('.layers__select') as HTMLSelectElement;

		this.layers.forEach((item) => {
			const opt = document.createElement('option');
			opt.value = item.name;
			opt.innerHTML = item.name;
			this.select.appendChild(opt);
		});

		this.select.addEventListener('change', (e) => {
			const v = (e.target as HTMLSelectElement).value;
			const config = this.layers.find((i) => i.name === v) as ILayerConfig;
			map.changeLayer(config);
		});

		map.changeLayer(this.layers[0]);
	}
}

export interface ILayerConfig {
	name: string;
	url: string;
	opt: any;
}