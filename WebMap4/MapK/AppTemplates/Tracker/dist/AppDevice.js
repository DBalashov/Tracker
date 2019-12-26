export default class AppDevice {
    constructor(urlImage, callback) {
        this.nameFolder = '(folder)';
        this.id = '';
        this.location = true;
        this.devicePopup = document.querySelector('.device__popup');
        this.containerControl = document.querySelector('.device__control');
        this.containerControl.addEventListener('click', () => this.devicePopup.classList.toggle('device__popup--open'));
        this.containerInfo = document.querySelector('.device__info');
        this.containerTree = document.querySelector('.device__tree');
        this.templateItem = document.getElementById('device__item-template');
        this.locationControl = document.querySelector('.device__location-control');
        this.locationControl.addEventListener('click', (e) => {
            this.location = !this.location;
            e.currentTarget.classList.toggle('device__location-control--active');
            if (this.location) {
                callback(this.id);
            }
        });
        this.urlImage = urlImage;
        this.callback = callback;
        document.addEventListener('click', (e) => {
            if (!this.containerControl.contains(e.target) && !this.devicePopup.contains(e.target)) {
                this.devicePopup.classList.remove('device__popup--open');
            }
        });
    }
    createPopup(parentID, data, level) {
        if (typeof data[parentID] === 'undefined')
            return;
        data[parentID].forEach((item) => {
            const htmlElement = this.templateItem.content.cloneNode(true);
            this.setElementData(htmlElement, item, level);
            this.containerTree.appendChild(htmlElement);
            const child = this.containerTree.querySelectorAll('.device__item');
            child[child.length - 1].addEventListener('click', () => {
                this.devicePopup.classList.remove('device__popup--open');
                this.callback(item.ID);
            });
            this.createPopup(item.ID, data, level + 1);
        });
    }
    setElementData(element, item, level) {
        const imageElement = element.querySelector('.device__item-image img');
        const nameElement = element.querySelector('.device__item-name');
        imageElement.src = this.urlImage + '/' + (typeof item.Serial === 'undefined' ? this.nameFolder : item.ImageColored);
        nameElement.innerHTML = item.Name;
        imageElement.parentElement.style.marginLeft = (10 * level) + 'px';
    }
    setData(r) {
        const result = {};
        const data = {
            'null': []
        };
        r.Groups.concat(r.Items).forEach((item) => {
            if (typeof data[item.ParentID] === 'undefined') {
                data[item.ParentID] = [];
            }
            data[item.ParentID].push(item);
            result[item.ID] = item;
        });
        this.createPopup('null', data, 0);
        return result;
    }
    setDevice(item) {
        this.id = item.ID;
        this.setElementData(this.containerControl, item, 0);
    }
}
//# sourceMappingURL=AppDevice.js.map