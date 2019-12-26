import L from 'leaflet';
import 'leaflet-hotline';
import 'leaflet-geometryutil';
import 'leaflet-almostover';
import 'leaflet-polylinedecorator';
export default class AppMap {
    constructor(urlImage, trackColors, markerCallback, trackCallback) {
        this.layerGroup = L.layerGroup([], {});
        this.trackCursorMarker = L.circleMarker([0, 0], {
            pane: AppMap.TRACK_ARROW_PANE,
            radius: 5,
            weight: 2,
            color: '#16a085',
            fillColor: 'white',
            fillOpacity: 1
        });
        this.trackStartMarker = L.marker([0, 0], {
            pane: AppMap.FLAGS_MARKER_PANE,
            icon: L.divIcon({
                className: 'marker marker--start',
                iconSize: [0, 24],
                iconAnchor: [0, 24]
            })
        });
        this.trackFinishMarker = L.marker([0, 0], {
            pane: AppMap.FLAGS_MARKER_PANE,
            icon: L.divIcon({
                className: 'marker marker--finish',
                iconSize: [0, 24],
                iconAnchor: [0, 24]
            })
        });
        this.trackPositionMarker = L.marker([0, 0], {
            pane: AppMap.TRACK_ARROW_PANE,
            icon: L.divIcon({
                className: 'marker marker--position',
                iconSize: [0, 0]
            })
        });
        this.distUnit = 'км';
        this.speedUnit = 'км/ч';
        this.hotlineLayer = null;
        this.deviceMarker = null;
        this.track = null;
        this.currentLayer = null;
        this.trackColors = {
            '0': '#27ae60',
            '1000': '#27ae60'
        };
        this.map = L.map('map', {
            preferCanvas: true,
            zoomControl: false
        });
        L.control.zoom({
            position: 'topright'
        }).addTo(this.map);
        const z = this.map.getContainer().querySelector('.leaflet-control-zoom');
        z.parentNode.style.top = '50%';
        z.parentNode.style.transform = 'translateY(-50%)';
        this.layerGroup.addTo(this.map);
        this.map.setView([55.162346, 61.406517], 12);
        this.map.doubleClickZoom.disable();
        this.urlImage = urlImage;
        this.markerCallback = markerCallback;
        this.trackCallback = trackCallback;
        this.markerTemplate = document.getElementById('marker-template');
        if (trackColors !== null) {
            this.trackColors = trackColors;
        }
        // --- panes ---
        [
            AppMap.TRACK_LINE_PANE,
            AppMap.TRACK_ARROW_PANE,
            AppMap.FLAGS_MARKER_PANE,
            AppMap.DEVICE_MARKER_PANE
        ].forEach((pane, i) => {
            this.map.createPane(pane);
            this.map.getPane(pane).style.zIndex = (600 + 10 * i + 10) + '';
        });
    }
    buildMarker(id, coord, image, name, angle, speed, dist, address) {
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
        const element = this.deviceMarker.getElement();
        const imageElement = element.querySelector('.marker__image');
        const nameElement = element.querySelector('.marker__name');
        imageElement.src = this.urlImage + '/' + image;
        nameElement.innerHTML = name;
        this.setMarkerInfo(this.deviceMarker, angle, speed, dist, address);
    }
    setMarkerInfo(marker, angle, speed, distance, address) {
        const element = marker.getElement();
        const borderElement = element.querySelector('.marker__border');
        const speedElement = element.querySelector('.marker__speed');
        const distanceElement = element.querySelector('.marker__dist');
        const addressElement = element.querySelector('.marker__address');
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
    positionByDate(d) {
        const t = d.getTime();
        const track = this.track;
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
        const point = new L.LatLng((pnts[index].lat * (1 - ratio)) + (ratio * pnts[index + 1].lat), (pnts[index].lng * (1 - ratio)) + (ratio * pnts[index + 1].lng));
        const angle = pnts.length > 1 ? L.GeometryUtil.angle(this.map, pnts[index > 0 ? index - 1 : 0], pnts[index > 0 ? index : index + 1]) : 0;
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
    distance(c1, c2) {
        let R = 6371023.0, D2R_1 = Math.PI / 180.0, D2R_2 = Math.PI / 360.0;
        let k1 = 0.006739496742337, k2 = 6335151.566466320913831, k3 = 0.993260503257663;
        let Lambda = (c1.lng - c2.lng) * D2R_1;
        let psPhi_2 = Math.sin((c1.lat - c2.lat) * D2R_2);
        psPhi_2 *= psPhi_2;
        let cosLat2D2R = Math.cos(c2.lat * D2R_1), sinLambda_2 = Math.sin(Lambda / 2.0);
        let asin_arg = psPhi_2 + Math.cos(c1.lat * D2R_1) * cosLat2D2R * sinLambda_2 * sinLambda_2;
        if (asin_arg < 0.0 || asin_arg > 1.0)
            return 0.0;
        let fz = 2.0 * Math.asin(Math.sqrt(asin_arg));
        asin_arg = (fz != 0.0) ? cosLat2D2R * Math.sin(Lambda) / Math.sin(fz) : 0.0;
        if (asin_arg < -1.0)
            asin_arg = -1.0;
        else if (asin_arg > +1.0)
            asin_arg = +1.0;
        let sinPhimean = Math.sin((c1.lat + c2.lat) * D2R_2);
        let Temp = 1.0 - k1 * sinPhimean * sinPhimean, sqTemp = Math.sqrt(Temp);
        let asin = Math.asin(asin_arg), sinAlpha = Math.sin(asin), cosAlpha = Math.cos(asin);
        R = (k2 / (Temp * sqTemp)) / (k3 * sinAlpha * sinAlpha / Temp + cosAlpha * cosAlpha);
        return fz * R;
    }
    closestLatLng(latlng) {
        const latlngs = this.hotlineLayer.getLatLngs();
        let mindist = Infinity;
        let result = null;
        for (let i = 0, n = latlngs.length; i < n - 1; i++) {
            const latlngA = latlngs[i];
            const latlngB = latlngs[i + 1];
            let distance = L.GeometryUtil.distanceSegment(this.map, latlng, latlngA, latlngB);
            if (distance <= mindist) {
                mindist = distance;
                result = L.GeometryUtil.closestOnSegment(this.map, latlng, latlngA, latlngB);
                result.distance = distance;
                result.index = i;
            }
        }
        return result;
    }
    changeLayer(config) {
        if (this.currentLayer !== null) {
            this.map.removeLayer(this.currentLayer);
        }
        this.map.options.crs = config.opt.crs ? config.opt.crs : L.CRS.EPSG3857;
        this.currentLayer = L.tileLayer(config.url, config.opt);
        this.map.addLayer(this.currentLayer);
    }
    clear() {
        if (this.hotlineLayer !== null) {
            this.map.almostOver.removeLayer(this.hotlineLayer);
            this.hotlineLayer.remove();
            this.hotlineLayer = null;
        }
        if (this.deviceMarker !== null) {
            this.deviceMarker.remove();
            this.deviceMarker = null;
        }
        this.layerGroup.clearLayers();
    }
    buildTrack(track, item, lastTime, focus, finishMarker) {
        this.track = track;
        let lastLatLng = null;
        if (this.deviceMarker !== null) {
            lastLatLng = this.deviceMarker.getLatLng();
        }
        this.clear();
        const data = [];
        const speeds = Object.keys(this.trackColors).map((s) => +s);
        const max = Math.max(...speeds);
        const plt = {};
        speeds.forEach((s) => {
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
            this.hotlineLayer = L.hotline(data, options).addTo(this.layerGroup);
            L.polylineDecorator(this.hotlineLayer, {
                pane: AppMap.TRACK_ARROW_PANE,
                patterns: [{
                        offset: '50px',
                        repeat: '150px',
                        symbol: L.Symbol.arrowHead({
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
            this.map.almostOver.addLayer(this.hotlineLayer);
            this.map
                .on('almost:over', () => {
                this.layerGroup.addLayer(this.trackCursorMarker);
            })
                .on('almost:move', (e) => {
                this.trackCursorMarker.setLatLng(e.latlng);
            })
                .on('almost:out', () => {
                this.layerGroup.removeLayer(this.trackCursorMarker);
            })
                .on('almost:click', (e) => {
                const r = this.closestLatLng(e.latlng);
                const pnts = e.layer.getLatLngs();
                const index = r.index;
                const length = pnts[index].distanceTo(pnts[index + 1]);
                const pos = pnts[index].distanceTo(e.latlng);
                const ratio = length > 0 ? pos / length : 1;
                const t1 = new Date(this.track.DT[index]).getTime();
                const t2 = new Date(this.track.DT[index + 1]).getTime();
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
            const position = this.positionByDate(lastTime);
            this.buildMarker(item.ID, lastLatLng, item.ImageColored, item.Name, position.angle, position.speed, position.dist, '');
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
    buildPositions(positions, devices, focus) {
        const bounds = L.latLngBounds([]);
        this.clear();
        Object.keys(positions).forEach((id) => {
            const p = positions[id];
            const d = devices[id];
            if (p != null && p._LastCoords != null && d) {
                const coord = L.latLng(p.LastPosition.Lat, p.LastPosition.Lng);
                this.buildMarker(d.ID, coord, d.ImageColored, p.Name, p.Course, p.Speed, 0, p.Address);
                bounds.extend(coord);
            }
        });
        if (this.map && bounds.isValid() && focus) {
            this.map.fitBounds(bounds, { padding: [100, 100] });
        }
    }
    moveMarker(d, setView) {
        if (this.deviceMarker === null)
            return null;
        const position = this.positionByDate(d);
        this.deviceMarker.setLatLng(position.latLng);
        this.setMarkerInfo(this.deviceMarker, position.angle, position.speed, position.dist, '');
        if (setView) {
            this.map.setView(position.latLng, this.map.getZoom());
        }
        return position;
    }
}
AppMap.TRACK_LINE_PANE = 'track-line-pane';
AppMap.TRACK_ARROW_PANE = 'track-arrow-pane';
AppMap.DEVICE_MARKER_PANE = 'device-marker-pane';
AppMap.FLAGS_MARKER_PANE = 'marker-flags-pane';
//# sourceMappingURL=AppMap.js.map