import L from 'leaflet';
import '../node_modules/leaflet/dist/leaflet.css';
import 'leaflet-hotline';
import 'leaflet-geometryutil';
import 'leaflet-almostover';
import { IDeviceItem, IEnumDevices } from "@/App";

export default class AppMap {
	private readonly map: L.Map;
	private readonly layerGroup: L.LayerGroup = L.layerGroup([], {});
	private readonly urlImage: string;
	private readonly markerCallback: (id: string) => void;
	private readonly trackCursor: L.CircleMarker = L.circleMarker([0, 0], {
		radius: 5,
		weight: 2,
		fillColor: 'white',
		fillOpacity: 1
	});

	constructor(urlImage: string, markerCallback: (id: string) => void) {
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

		this.map.doubleClickZoom.disable();

		this.urlImage = urlImage;

		this.markerCallback = markerCallback;
	}

	private buildMarker(id: string, coord: L.LatLng, image: string): void {
		L.marker(coord, {
			icon: L.icon({
				iconUrl: this.urlImage + '/' + image,
				iconSize: [24, 24]
			})
		})
		.on('click', () => this.markerCallback(id))
		.addTo(this.layerGroup);
	}

	public clear(): void {
		this.layerGroup.clearLayers();
	}

	public buildTrack(track: ITrack, item: IDeviceItem): void {
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
			const last = data.length - 1;
			const hotlineLayer = (<any>L).hotline(data, options).addTo(this.layerGroup);

			(<any>this.map).almostOver.addLayer(hotlineLayer);

			this.map
				.on('almost:over', () => {
					this.map.addLayer(this.trackCursor);
				})
				.on('almost:move', (e: any) => {
					this.trackCursor.setLatLng(e.latlng);
				})
				.on('almost:out', () => {
					this.map.removeLayer(this.trackCursor);
				});



			this.map.fitBounds(hotlineLayer.getBounds());

			this.buildMarker(item.ID, L.latLng(data[last][0], data[last][1]), item.ImageColored as string);
		}
	}

	public buildPositions(positions: any, devices: IEnumDevices): void {
		const bounds = L.latLngBounds([]);

		this.clear();

		Object.keys(positions).forEach((id: string) => {
			const p = positions[id];
			const d = devices[id];

			if (p != null && p._LastCoords != null && d) {
				const coord = L.latLng(p.LastPosition.Lat, p.LastPosition.Lng);

				this.buildMarker(d.ID, coord, d.ImageColored as string);

				bounds.extend(coord);
			}
		});

		if (this.map && bounds.isValid()) {
			this.map.fitBounds(bounds);
		}
	}
}

interface ITrack {
	Lat: number[];
	Lng: number[];
	Speed: number[];
	DT: string[];
}

