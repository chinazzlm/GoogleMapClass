/**
 * 一个简单调用谷歌地图API的操作类，用于查询地址或地区名称的定位
 * 当前版本: 0.0.1
 * 当前功能: 国家切换、自动完成搜索、坐标拖动（不支持直接点击）
 */

/**
 * options {object}
 * |- mapNode {element}   地图节点
 * |- searchInpNode {element}   搜索输入框
 * |- countryNode {element}   国家选择
 * |- apiKey {string}    地图API的Key钥
 * |- callbackName {string}   加载完JS后的回调函数名
 * |- getMarkerLatLng {function}  处理marker的坐标函数
 * |- error {function}   错误信息回调函数
 */
var GGMap = function(options) {
    this.options = options;
    this.dom = {};
    this.status = {};
    this.countries = {
        'all': {
          center: {lat: 15, lng: 0},
          zoom: 2,
          name: "全球"
        },
        'au': {
          center: {lat: -25.3, lng: 133.8},
          zoom: 4,
          name: "澳洲(AU)"
        },
        'uk': {
          center: {lat: 54.8, lng: -4.6},
          zoom: 5,
          name: "英国(UK)"
        }
    }
};

// 激活初始化 由外部触发
GGMap.prototype.init = function() {
    if (this.status.script) return this;
    this.dom.script = document.createElement('script');
    this.dom.script.src = 'https://maps.googleapis.com/maps/api/js?key=' + this.options.apiKey + '&signed_in=true&libraries=places&callback=' + this.options.callbackName;
    document.querySelector('head').appendChild(this.dom.script);
    var that = this;
    if (this.options.countryNode) {
        for (var i in this.countries) {
            if (i == '__proto__') continue;
            var item = document.createElement('option');
            item.value = i;
            item.innerHTML = this.countries[i].name;
            this.options.countryNode.appendChild(item);
        }
        this.options.countryNode.addEventListener('change',function(e) {
            that.toggleCountry();
        },false);
    }
    this.dom.script.onload = function() {
        that.status.script = true;
    }
    return this;
}

// 初始化地图
GGMap.prototype.initMap = function() {
    this.map = new google.maps.Map(this.options.mapNode,{
        zoom: 5,
        center: {
            lat: 54.8,
            lng: -4.6
        }
    });
    // 初始化自动提示搜索功能
    this.autocomplete = new google.maps.places.Autocomplete(this.options.searchInpNode);

    // 创建地点搜索对象
    this.places = new google.maps.places.PlacesService(this.map);

    // place选择的返回事件绑定
    var that = this;
    this.autocomplete.addListener('place_changed', function() {
        that.placeSelectChanged();
    });

    return this;
}

// place的结果返回接收处理
GGMap.prototype.placeSelectChanged = function() {
    var place = this.autocomplete.getPlace();
    if (place.geometry) {
        // 移动到选择点去
        this.map.panTo(place.geometry.location);
        this.map.setZoom(14);
        this.markerRender(place.geometry.location.lat(),place.geometry.location.lng());
        if (typeof this.options.getMarkerLatLng === 'function') {
            this.options.getMarkerLatLng(place.geometry.location.lat(),place.geometry.location.lng());
        }
    } else {
        if (typeof this.options.error === 'function') {
            this.options.error('请不要回车直接搜索，目前只能选择谷歌为您匹配的列表')
        }
    }

    return this;
};

// 地图上的marker渲染方法
GGMap.prototype.markerRender = function(lat,lng) {
    if (!this.marker) {
        this.marker = new google.maps.Marker({
            map: this.map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            position: {
                lat: lat,
                lng: lng
            }
        })
        var that = this;
        this.marker.addListener('dragend',function(e) {
            if (typeof that.options.getMarkerLatLng === 'function') {
                that.options.getMarkerLatLng(e.latLng.lat(),e.latLng.lng());
            }
        })
    } else {
        this.marker.setPosition({
            lat: lat,
            lng: lng
        })
    }
    return this;
}

// 切换国家地区选择
GGMap.prototype.toggleCountry = function() {
    if (!this.status.script) return this;
    var _country = this.options.countryNode.value;
    if (_country == 'all') {
        this.autocomplete.setComponentRestrictions([])
    } else {
        this.autocomplete.setComponentRestrictions({
            "country": _country
        })
    }
    this.map.setCenter(this.countries[_country].center)
    this.map.setZoom(this.countries[_country].zoom)
    return this;
}
