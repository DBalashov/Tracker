import L from 'leaflet';
import 'leaflet-hotline';
import 'leaflet-geometryutil';
import 'leaflet-almostover';
import 'leaflet-polylinedecorator';
import { IDeviceItem, IEnumDevices } from '@/App';
import { ILayerConfig } from '@/AppLayers';

export default class AppMap {
	private static TRACK_LINE_PANE = 'track-line-pane';
	private static TRACK_ARROW_PANE = 'track-arrow-pane';
	private static DEVICE_MARKER_PANE = 'device-marker-pane';
	private static FLAGS_MARKER_PANE = 'marker-flags-pane';
	
	private readonly markerTemplate: HTMLTemplateElement;
	private readonly map: L.Map;
	private readonly layerGroup: L.LayerGroup = L.layerGroup([], {});
	private readonly urlImage: string;
	private readonly markerCallback: (id: string) => void;
	private readonly trackCallback: (d: Date) => void;
	private readonly trackCursorMarker: L.CircleMarker = L.circleMarker([0, 0], {
		pane: AppMap.TRACK_ARROW_PANE,
		radius: 5,
		weight: 2,
		color: '#16a085',
		fillColor: 'white',
		fillOpacity: 1
	});
	private readonly trackStartMarker: L.Marker = L.marker([0, 0], {
		pane: AppMap.FLAGS_MARKER_PANE,
		icon: L.divIcon({
			className: 'marker marker--start',
			iconSize: [0, 24],
			iconAnchor: [0, 24]
		})
	});
	private readonly trackFinishMarker: L.Marker = L.marker([0, 0], {
		pane: AppMap.FLAGS_MARKER_PANE,
		icon: L.divIcon({
			className: 'marker marker--finish',
			iconSize: [0, 24],
			iconAnchor: [0, 24]
		})
	});
	private readonly trackPositionMarker: L.Marker = L.marker([0, 0], {
		pane: AppMap.TRACK_ARROW_PANE,
		icon: L.divIcon({
			className: 'marker marker--position',
			iconSize: [0, 0]
		})
	});
	private readonly distUnit: string = 'км';
	private readonly speedUnit: string = 'км/ч';
	private hotlineLayer: L.Polyline | null = null;
	private deviceMarker: L.Marker | null = null;
	private track: ITrack | null = null;
	private currentLayer: L.TileLayer | null = null;
	private trackColors: ITrackColors = {
		'0': '#27ae60',
		'1000': '#27ae60'
	};

	constructor(urlImage: string, trackColors: ITrackColors | null, markerCallback: (id: string) => void, trackCallback: (d: Date) => void) {
		this.map = L.map('map', {
			preferCanvas: true,
			zoomControl: false
		});

		L.control.zoom({
			position: 'topright'
		}).addTo(this.map);

		const z = this.map.getContainer().querySelector('.leaflet-control-zoom') as HTMLElement;
		(z.parentNode as HTMLElement).style.top = '50%';
		(z.parentNode as HTMLElement).style.transform = 'translateY(-50%)';

		this.layerGroup.addTo(this.map);

		this.map.setView([55.162346, 61.406517], 12);

		this.map.doubleClickZoom.disable();

		this.urlImage = urlImage;

		this.markerCallback = markerCallback;

		this.trackCallback = trackCallback;

		this.markerTemplate = document.getElementById('marker-template') as HTMLTemplateElement;

		if (trackColors !== null) {
			this.trackColors = trackColors;
		}
		
		// --- panes ---

		[
			AppMap.TRACK_LINE_PANE,
			AppMap.TRACK_ARROW_PANE,
			AppMap.FLAGS_MARKER_PANE,
			AppMap.DEVICE_MARKER_PANE
		].forEach((pane: string, i: number) => {
			this.map.createPane(pane);
			(this.map.getPane(pane) as HTMLElement).style.zIndex = (600 + 10 * i + 10) + '';
		});
	}

	private buildMarker(id: string, coord: L.LatLng, image: string, name: string, angle: number, speed: number, dist: number, address: string): void {
		this.deviceMarker = L.marker(coord, {
			pane: AppMap.DEVICE_MARKER_PANE,
			icon: L.divIcon({
				className: '',
				iconSize: [24, 24],
				html: this.markerTemplate.innerHTML
			})
		})
		.on('click', () => this.markerCallback(id))
		.addTo(this.layerGroup);

		const element = this.deviceMarker.getElement() as HTMLElement;
		const imageElement = element.querySelector('.marker__image') as HTMLImageElement;
		const nameElement = element.querySelector('.marker__name') as HTMLElement;

		imageElement.src = this.urlImage + '/' + image;
		nameElement.innerHTML = name;

		this.setMarkerInfo(this.deviceMarker, angle, speed, dist, address);
	}

	private setMarkerInfo(marker: L.Marker, angle: number, speed: number, distance: number, address: string): void {
		const element = marker.getElement() as HTMLElement;
		const borderElement = element.querySelector('.marker__border') as HTMLElement;
		const speedElement = element.querySelector('.marker__speed') as HTMLElement;
		const distanceElement = element.querySelector('.marker__dist') as HTMLElement;
		const addressElement = element.querySelector('.marker__address') as HTMLElement;

		borderElement.style.color = '#34495e';
		borderElement.style.transform = 'rotate(' + angle + 'deg)';

		speed = Math.round(speed);
		speedElement.innerHTML = speed > 0 ? speed + ' ' + this.speedUnit : '';

		distance = Math.round(distance / 1000);
		distanceElement.innerHTML = distance > 0 ? distance.toLocaleString() + ' ' + this.distUnit : '';

		addressElement.innerHTML = address;

		element.classList.add('marker--updated');
		setTimeout(() => element.classList.remove('marker--updated'), 3000);
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

	public changeLayer(config: ILayerConfig): void {
		if (this.currentLayer !== null) {
			this.map.removeLayer(this.currentLayer);
		}

		this.map.options.crs = config.opt.crs ? config.opt.crs : L.CRS.EPSG3857;

		this.currentLayer = L.tileLayer(config.url, config.opt);

		this.map.addLayer(this.currentLayer);
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

	public buildTrack(track: ITrack, item: IDeviceItem, lastTime: Date, focus: boolean, finishMarker: boolean): void {
		this.track = track;

		let lastLatLng = null;

		if (this.deviceMarker !== null) {
			lastLatLng = this.deviceMarker.getLatLng();
		}

		this.clear();

		const data = [];
		const speeds = Object.keys(this.trackColors).map((s) => +s);
		const max = Math.max(...speeds);
		const plt: ITrackColors = {};

		speeds.forEach((s: number) => {
			plt[s / (max === 0 ? 1 : max)] = this.trackColors[s + ''];
		});

		for (let i = 0; i < track.Lat.length; i++) {
			data.push([track.Lat[i], track.Lng[i], track.Speed[i]]);
		}

		if (data.length > 0) {
			const options = {
				pane: AppMap.TRACK_LINE_PANE,
				min: 0,
				max: max,
				palette: plt,
				weight: 4,
				outlineColor: '#000000',
				outlineWidth: 0.5,
				clickable: true,
				smoothFactor: 0.25,
				pntIndexOffset: 0
			};
			const last = data.length - 1;

			this.hotlineLayer = (<any>L).hotline(data, options).addTo(this.layerGroup);

			(<any>L).polylineDecorator(this.hotlineLayer, {
				pane: AppMap.TRACK_ARROW_PANE,
				patterns: [{
					offset: '50px',
					repeat: '150px',
					symbol: (<any>L).Symbol.arrowHead({
						pixelSize: 7,
						polygon: true,
						pathOptions: {
							opacity: 0.9,
							color: '#2c3e50',
							weight: 1,
							fillColor: '#ecf0f1',
							fill: true,
							fillOpacity: 1
						}
					}),
					border: true,
					fill: false,
					getColor: null
				}]
			}).addTo(this.layerGroup);

			(<any>this.map).almostOver.addLayer(this.hotlineLayer);

			this.map
				.on('almost:over', () => {
					this.layerGroup.addLayer(this.trackCursorMarker);
				})
				.on('almost:move', (e: any) => {
					this.trackCursorMarker.setLatLng(e.latlng);
				})
				.on('almost:out', () => {
					this.layerGroup.removeLayer(this.trackCursorMarker);
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
				const zoom = lastLatLng === null ? 16 : this.map.getZoom();

				lastLatLng = L.latLng(data[last][0], data[last][1]);
				//this.map.fitBounds((this.hotlineLayer as L.Polyline).getBounds(), { padding: [100, 100] });
				this.map.setView(lastLatLng, zoom);
			}

			// --- device marker ---

			const position: IPosition = this.positionByDate(lastTime);

			this.buildMarker(item.ID, lastLatLng, item.ImageColored as string, item.Name, position.angle, position.speed, position.dist, '');
			
			// --- start position marker ---

			this.trackStartMarker.setLatLng([data[0][0], data[0][1]]);
			this.trackStartMarker.addTo(this.layerGroup);

			// --- last position marker ---

			this.trackPositionMarker.setLatLng([data[last][0], data[last][1]]);
			this.trackPositionMarker.addTo(this.layerGroup);
			setTimeout(() => this.layerGroup.removeLayer(this.trackPositionMarker), 3000);

			// --- finish position marker ---

			if (finishMarker) {
				this.trackFinishMarker.setLatLng([data[last][0], data[last][1]]);
				this.trackFinishMarker.addTo(this.layerGroup);
			}
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

				this.buildMarker(d.ID, coord, d.ImageColored as string, p.Name, p.Course, p.Speed, 0, p.Address);

				bounds.extend(coord);
			}
		});

		if (this.map && bounds.isValid() && focus) {
			this.map.fitBounds(bounds, { padding: [100, 100] });
		}
	}

	public moveMarker(d: Date, setView: boolean): IPosition | null {
		if (this.deviceMarker === null) return null;

		const position = this.positionByDate(d);

		this.deviceMarker.setLatLng(position.latLng);

		this.setMarkerInfo(this.deviceMarker, position.angle, position.speed, position.dist, '');

		if (setView) {
			this.map.setView(position.latLng, this.map.getZoom());
		}

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

interface ITrackColors {
	[key: string]: string;
}