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
	private readonly trackCallback: (d: Date) => void;
	private readonly trackCursor: L.CircleMarker = L.circleMarker([0, 0], {
		radius: 5,
		weight: 2,
		fillColor: 'white',
		fillOpacity: 1
	});
	private hotlineLayer: L.Polyline | null = null;
	private deviceMarker: L.Marker | null = null;
	private track: ITrack | null = null;

	constructor(urlImage: string, markerCallback: (id: string) => void, trackCallback: (d: Date) => void) {
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

		this.trackCallback = trackCallback;
	}

	private buildMarker(id: string, coord: L.LatLng, image: string): void {
		this.deviceMarker = L.marker(coord, {
			icon: L.icon({
				iconUrl: this.urlImage + '/' + image,
				iconSize: [24, 24]
			})
		})
		.on('click', () => this.markerCallback(id))
		.addTo(this.layerGroup);
	}

	private positionByDate(d: Date): IPosition {
		const t = d.getTime();
		const track = this.track as ITrack;
		const pnts = track.DT.map((p, i) => {
			return L.latLng([track.Lat[i], track.Lng[i]]);
		});
		let ratio = 0;
		let index = 0;

		for (let k = 0; k < track.DT.length - 1; k++) {
			const t1 = new Date(track.DT[k]).getTime();
			const t2 = new Date(track.DT[k + 1]).getTime();

			if (t >= t1 && t <= t2) {
				index = k;
				ratio = t2 > t1 ? (t - t1) / (t2 - t1) : 0;
				break;
			}
		}

		const point = new L.LatLng(
			(pnts[index].lat * (1 - ratio)) + (ratio * pnts[index + 1].lat), (pnts[index].lng * (1 - ratio)) + (ratio * pnts[index + 1].lng)
		);
		const angle = pnts.length > 1 ? (<any>L).GeometryUtil.angle(this.map, pnts[index > 0 ? index - 1 : 0], pnts[index > 0 ? index : index + 1]) : 0;

		let dist = 0;
		for (let i = 1; i <= index; i++) {
			dist += this.distance(pnts[i - 1], pnts[i]);
		}

		return {
			latLng: point,
			angle: angle >= 0 ? angle : -1,
			dist: dist,
			speed: track.Speed[index],
			index: index,
			date: d
		};
	}

	private distance(c1: L.LatLng, c2: L.LatLng): number {
		let R = 6371023.0, D2R_1 = Math.PI / 180.0, D2R_2 = Math.PI / 360.0;
		let k1 = 0.006739496742337, k2 = 6335151.566466320913831, k3 = 0.993260503257663;

		let Lambda = (c1.lng - c2.lng) * D2R_1;
		let psPhi_2 = Math.sin((c1.lat - c2.lat) * D2R_2); psPhi_2 *= psPhi_2;
		let cosLat2D2R = Math.cos(c2.lat * D2R_1), sinLambda_2 = Math.sin(Lambda / 2.0);
		let asin_arg = psPhi_2 + Math.cos(c1.lat * D2R_1) * cosLat2D2R * sinLambda_2 * sinLambda_2;
		if (asin_arg < 0.0 || asin_arg > 1.0) return 0.0;
		let fz = 2.0 * Math.asin(Math.sqrt(asin_arg));
		asin_arg = (fz != 0.0) ? cosLat2D2R * Math.sin(Lambda) / Math.sin(fz) : 0.0;
		if (asin_arg < -1.0) asin_arg = -1.0;
		else if (asin_arg > +1.0) asin_arg = +1.0;
		let sinPhimean = Math.sin((c1.lat + c2.lat) * D2R_2);
		let Temp = 1.0 - k1 * sinPhimean * sinPhimean, sqTemp = Math.sqrt(Temp);
		let asin = Math.asin(asin_arg), sinAlpha = Math.sin(asin), cosAlpha = Math.cos(asin);
		R = (k2 / (Temp * sqTemp)) / (k3 * sinAlpha * sinAlpha / Temp + cosAlpha * cosAlpha);
		return fz * R;
	}

	private closestLatLng(latlng: L.LatLngExpression) {
		const latlngs = (this.hotlineLayer as L.Polyline).getLatLngs();
		let mindist = Infinity;
		let result = null;

		for (let i = 0, n = latlngs.length; i < n-1; i++) {
			const latlngA = latlngs[i];
			const latlngB = latlngs[i+1];

			let distance = (<any>L).GeometryUtil.distanceSegment(this.map, latlng, latlngA, latlngB);
			if (distance <= mindist) {
				mindist = distance;
				result = (<any>L).GeometryUtil.closestOnSegment(this.map, latlng, latlngA, latlngB);
				result.distance = distance;
				result.index = i;
			}
		}

		return result;
	}

	public clear(): void {
		if (this.hotlineLayer !== null) {
			(<any>this.map).almostOver.removeLayer(this.hotlineLayer);
			this.hotlineLayer.remove();
			this.hotlineLayer = null;
		}

		if (this.deviceMarker !== null) {
			this.deviceMarker.remove();
			this.deviceMarker = null;
		}

		this.layerGroup.clearLayers();
	}

	public buildTrack(track: ITrack, item: IDeviceItem, focus: boolean): void {
		this.track = track;

		let lastLatLng = null;

		if (this.deviceMarker !== null) {
			lastLatLng = this.deviceMarker.getLatLng();
		}

		this.clear();

		const data = [];

		let max = 0;

		for (let i = 0; i < track.Lat.length; i++) {
			const speed = track.Speed[i];

			if (speed > max) max = speed;

			data.push([track.Lat[i], track.Lng[i], track.Speed[i]]);
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
				smoothFactor: 0.25,
				pntIndexOffset: 0
			};
			const last = data.length - 1;

			this.hotlineLayer = (<any>L).hotline(data, options).addTo(this.layerGroup);

			(<any>this.map).almostOver.addLayer(this.hotlineLayer);

			this.map
				.on('almost:over', () => {
					this.map.addLayer(this.trackCursor);
				})
				.on('almost:move', (e: any) => {
					this.trackCursor.setLatLng(e.latlng);
				})
				.on('almost:out', () => {
					this.map.removeLayer(this.trackCursor);
				})
				.on('almost:click', (e: any) => {
					const r = this.closestLatLng(e.latlng);
					const pnts = e.layer.getLatLngs();
					const index = r.index;
					const length = pnts[index].distanceTo(pnts[index + 1]);
					const pos = pnts[index].distanceTo(e.latlng);
					const ratio = length > 0 ? pos / length : 1;
					const t1 = new Date((this.track as ITrack).DT[index]).getTime();
					const t2 = new Date((this.track as ITrack).DT[index + 1]).getTime();
					const d = new Date();

					d.setTime((t1 * (1 - ratio)) + (ratio * t2));

					this.trackCallback(d);
				});

			if (focus || lastLatLng === null) {
				lastLatLng = L.latLng(data[last][0], data[last][1]);
				this.map.fitBounds((this.hotlineLayer as L.Polyline).getBounds(), { padding: [100, 100] });
			} else {

			}

			this.buildMarker(item.ID, lastLatLng, item.ImageColored as string);
		}
	}

	public buildPositions(positions: any, devices: IEnumDevices, focus: boolean): void {
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

		if (this.map && bounds.isValid() && focus) {
			this.map.fitBounds(bounds);
		}
	}

	public moveMarker(d: Date): IPosition | null {
		if (this.deviceMarker === null) return null;

		const position = this.positionByDate(d);

		this.deviceMarker.setLatLng(position.latLng);

		return position;
	}
}

interface ITrack {
	Lat: number[];
	Lng: number[];
	Speed: number[];
	DT: string[];
}

interface IPosition {
	latLng: L.LatLngExpression;
	angle: number;
	dist: number;
	speed: number;
	index: number;
	date: Date
}
