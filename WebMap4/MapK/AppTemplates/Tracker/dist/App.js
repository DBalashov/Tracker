import AppDevice from './AppDevice';
import AppPeriod from './AppPeriod';
import AppLayers from './AppLayers';
import AppMap from './AppMap';
import AppTimeline from './AppTimeline';
// --- config: ---
// serial: serial number (if it exists open app for this device)
// trackColors: JSON ('{"0": "#2980b9", "60": "#2ecc71", "110": "#e74c3c"}')
// ---
export default class App {
    constructor(config) {
        this.refreshTime = 15000;
        this.refreshTimeout = 0;
        this.refreshActive = true;
        this.id = '';
        this.data = {};
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register(config.Urls.Relative + '/sw.js').then((reg) => {
                if (reg.installing) {
                    //console.log('Service worker installing');
                }
                else if (reg.waiting) {
                    //console.log('Service worker installed');
                }
                else if (reg.active) {
                    //console.log('Service worker active');
                }
            }).catch((error) => {
                //console.log('Registration failed with ' + error);
            });
        }
        this.serial = +config.Settings.serial;
        this.url = config.Urls.Service + '/';
        this.token = config.Token;
        this.schemaID = config.Organization.UID;
        let trackColors;
        try {
            trackColors = JSON.parse(config.Settings.trackColors);
        }
        catch (e) {
            trackColors = null;
        }
        this.device = new AppDevice(config.Urls.ImageCar, (id) => this.onChangeDevice(id));
        this.period = new AppPeriod((sd, ed) => {
            const d = new Date();
            this.refreshActive = d.getFullYear() === ed.getFullYear() && d.getMonth() === ed.getMonth() && d.getDate() === ed.getDate();
            this.map.clear();
            this.timeline.setValue(null);
            this.refreshTrack(false);
        });
        this.map = new AppMap(config.Urls.ImageCar, trackColors, (id) => this.id !== id && this.onChangeDevice(id), (d) => {
            this.onChangePosition(d, false);
            this.timeline.setValue(d);
        });
        this.layers = new AppLayers(this.map);
        this.timeline = new AppTimeline((d) => {
            this.onChangePosition(d, true);
        });
        this.post('EnumDevices', {}, (r) => {
            this.data = this.device.setData(r);
            let item = r.Groups.find((g) => g.ParentID === null);
            if (this.serial) {
                const i = r.Items.find((g) => g.Serial === this.serial);
                if (i)
                    item = i;
            }
            this.onChangeDevice(item.ID);
        });
    }
    onChangeDevice(id) {
        this.message('notrack', false);
        const item = this.data[id];
        this.id = id;
        this.device.setDevice(item);
        this.map.clear();
        if (typeof item.Serial === 'undefined') {
            this.period.disable();
            this.timeline.hide();
            this.refreshPosition();
        }
        else {
            this.period.enable();
            this.timeline.show();
            this.refreshTrack(true);
        }
    }
    onChangePosition(d, setView) {
        this.map.moveMarker(d, setView);
    }
    refreshTrack(focus) {
        const { sd, ed } = this.period.getDate();
        clearTimeout(this.refreshTimeout);
        this.message('notrack', false);
        this.progress(true);
        this.post('GetTrack', {
            IDs: this.id,
            SD: this.fmtDT(sd),
            ED: this.fmtDT(ed),
            tripSplitterIndex: -1
        }, (r) => {
            this.progress(false);
            if (r[this.id].length === 0 || !r[this.id][0] || r[this.id][0].DT.length == 0) {
                this.map.clear();
                this.timeline.hide();
                this.message('notrack', true, 'Нет данных');
                return;
            }
            else {
                this.timeline.show();
            }
            const track = r[this.id][0];
            let lastTime = this.timeline.getValue();
            if (this.device.location || lastTime === null) {
                lastTime = new Date(track.DT[track.DT.length - 1]);
            }
            this.map.buildTrack(track, this.data[this.id], lastTime, this.device.location || focus, !this.refreshActive);
            this.timeline.setData(track.DT, track.Speed);
            this.timeline.setValue(lastTime);
            if (this.refreshActive) {
                this.refreshTimeout = setTimeout(() => this.refreshTrack(false), this.refreshTime);
            }
        });
    }
    refreshPosition() {
        clearTimeout(this.refreshTimeout);
        this.progress(true);
        this.post('GetOnlineInfo', {
            IDs: this.id
        }, (r) => {
            this.map.buildPositions(r, this.data, this.device.location);
            this.refreshTimeout = setTimeout(() => this.refreshPosition(), this.refreshTime);
            this.progress(false);
        });
    }
    fmtDT(d) {
        const mm = d.getUTCMonth() + 1;
        const dd = d.getUTCDate();
        const hh = d.getUTCHours();
        const mi = d.getUTCMinutes();
        return d.getUTCFullYear() + (mm > 9 ? '' : '0') + mm + (dd > 9 ? '' : '0') + dd + '-' + (hh > 9 ? '' : '0') + hh + (mi > 9 ? '' : '0') + mi;
    }
    post(method, data, callback) {
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
    message(id, show, message) {
        const m = document.querySelector('.message--' + id);
        if (m === null)
            return;
        m.classList[show ? 'add' : 'remove']('message--visible');
        m.innerHTML = message ? message : '';
    }
    progress(state) {
        document.querySelector('body').classList[state ? 'add' : 'remove']('loading');
    }
}
//# sourceMappingURL=App.js.map