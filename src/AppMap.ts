import L from 'leaflet';
import '../node_modules/leaflet/dist/leaflet.css';
import '../node_modules/leaflet-hotline/dist/leaflet.hotline.js';

export default class AppMap {
	private map: L.Map;
	private layerGroup: L.LayerGroup = L.layerGroup([], {});

	constructor() {
		this.map = L.map('map', {
			preferCanvas: true,
			zoomControl: false
		});

		L.control.zoom({
			position: 'topright'
		}).addTo(this.map);

		this.map.addLayer(L.tileLayer('//tile{s}.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', { subdomains: '0123', maxZoom: 18 }));

		this.layerGroup.addTo(this.map);

		this.map.setView([55.162346, 61.406517], 12);
	}

	public clear(): void {
		this.layerGroup.clearLayers();
	}

	public buildTrack(track: ITrack): void {
		this.clear();

		const bounds = L.latLngBounds([]);
		const data = [];

		let max = 0;

		for (let i = 0; i < track.Lat.length; i++) {
			const speed = track.Speed[i];

			if (speed > max) max = speed;

			data.push([track.Lat[i], track.Lng[i], track.Speed[i]]);
		}

		if (bounds.isValid()) {
			this.map.fitBounds(bounds, { padding: [100, 100] });
		}

		if (data.length > 0) {
			const options = {
				min: 0,
				max: max,
				palette: {
					0.0: '#008800',
					0.5: '#ffff00',
					1.0: '#ff0000'
				},
				weight: 3,
				outlineColor: '#000000',
				outlineWidth: 0.5,
				clickable: true,
				smoothFactor: 0.25
			};
			const hotlineLayer = (<any>L).hotline(data, options).addTo(this.layerGroup);

			this.map.fitBounds(hotlineLayer.getBounds());
		}
	}
}

interface ITrack {
	Lat: number[];
	Lng: number[];
	Speed: number[];
	DT: string[];
}

