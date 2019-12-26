export default class AppTimeline {
    constructor(callback) {
        this.times = [];
        this.value = null;
        this.container = document.querySelector('.timeline');
        this.status = this.container.querySelector('.timeline__status');
        this.cursorTop = this.container.querySelector('.timeline__cursor--top');
        this.cursorMiddle = this.container.querySelector('.timeline__cursor--middle');
        this.dateContainer = this.container.querySelector('.timeline__date');
        this.dateItemTemplate = document.getElementById('timeline__date-item-template');
        this.status.addEventListener('click', (e) => {
            const width = e.target.clientWidth;
            const offset = e.offsetX;
            const d = width / offset;
            const period = this.times[this.times.length - 1].getTime() - this.times[0].getTime();
            this.value.setTime(this.times[0].getTime() + period / d);
            this.setCursor(this.value, 100 / d);
            callback(this.value);
        });
    }
    setCursor(value, left) {
        const day = value.getDate();
        const month = value.getMonth();
        const hh = value.getHours();
        const mm = value.getMinutes();
        const ss = value.getSeconds();
        this.cursorTop.innerHTML = (hh > 9 ? hh : '0' + hh) + ':' + (mm > 9 ? mm : '0' + mm) + ':' + (ss > 9 ? ss : '0' + ss);
        const width = this.status.clientWidth;
        const cursorTopHalf = (100 / (width / this.cursorTop.clientWidth)) / 2;
        let cursorTopLeft = left - cursorTopHalf;
        if (cursorTopLeft < 0) {
            cursorTopLeft = 0;
        }
        else if (left + cursorTopHalf > 100) {
            cursorTopLeft = 100 - cursorTopHalf * 2;
        }
        this.cursorTop.style.left = cursorTopLeft + '%';
        this.cursorMiddle.style.left = left + '%';
    }
    show() {
        this.container.classList.add('timeline--visible');
    }
    hide() {
        this.container.classList.remove('timeline--visible');
    }
    setData(times, speed) {
        this.times = times.map((t) => new Date(t));
        const minTime = this.times[0].getTime();
        const maxTime = this.times[this.times.length - 1].getTime();
        const period = maxTime - minTime;
        // --- Dates ---
        this.dateContainer.innerHTML = '';
        let info = {};
        this.times.forEach((item) => {
            const day = item.getDate();
            const month = item.getMonth();
            const d = (day > 9 ? day : '0' + day) + '.' + (month > 9 ? month : '0' + month) + '.' + item.getFullYear();
            info[d] = item.getTime();
        });
        let startTime = minTime;
        let n = Object.keys(info).length - 1;
        let i = 0;
        for (let d in info) {
            const htmlElement = this.dateItemTemplate.content.cloneNode(true);
            this.dateContainer.appendChild(htmlElement);
            const element = this.dateContainer.lastChild;
            // ---
            const dt = new Date();
            dt.setTime(info[d]);
            // ---
            if (i > 0) {
                dt.setHours(0, 0, 0, 0);
                startTime = dt.getTime();
            }
            // ---
            let endTime = info[d];
            if (i !== n) {
                dt.setHours(23, 59, 59, 999);
                endTime = dt.getTime();
            }
            // ---
            element.innerHTML = d;
            element.style.width = (100 / (period / (endTime - startTime))) + '%';
            // ---
            i++;
        }
        // --- Stops ---
        startTime = minTime;
        const gradients = [];
        let currentWidth = 0;
        let prevPosition = 0;
        let stops = [];
        speed = speed.map((s) => Math.round(s));
        for (let i = 0; i < speed.length - 1; i++) {
            let endTime = this.times[i + 1].getTime();
            currentWidth = 100 / (period / (endTime - startTime));
            if (speed[i] === 0 && speed[i + 1] === 0 || speed[i] !== 0 && speed[i + 1] !== 0) {
                continue;
            }
            if (speed[i] === 0) {
                stops.push([prevPosition, currentWidth]);
            }
            startTime = endTime;
            prevPosition += currentWidth;
        }
        if (stops.length > 0 && speed[speed.length - 1] === 0) {
            stops.push([prevPosition, currentWidth]);
        }
        stops.forEach((d) => {
            this.status.innerHTML += '<i style="left: ' + d[0] + '%; width: ' + d[1] + '%;"></i>';
        });
    }
    setValue(value) {
        this.value = value;
        if (value === null)
            return;
        const offset = value.getTime() - this.times[0].getTime();
        const period = this.times[this.times.length - 1].getTime() - this.times[0].getTime();
        const d = period / offset;
        this.setCursor(value, 100 / d);
    }
    getValue() {
        return this.value;
    }
}
//# sourceMappingURL=AppTimeline.js.map