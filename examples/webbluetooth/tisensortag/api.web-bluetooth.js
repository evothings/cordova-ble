/* @license
 *
 * BLE Abstraction Tool: core functionality - web bluetooth specification
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Rob Moran
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// https://github.com/umdjs/umd
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        if (root.navigator.bluetooth) {
            // Return existing web-bluetooth
            define(root.navigator.bluetooth);
        } else {
            define(['es6-promise', 'es6-map', 'bluetooth.helpers'], factory);
        }
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS
        module.exports = factory(Promise, Map, require('./bluetooth.helpers'));
    } else {
        // Browser globals with support for web workers (root is window)
        // Assume Promise exists or has been poly-filled
        root.bleat = root.navigator.bluetooth || factory(root.Promise, root.Map, root.bleatHelpers);
    }
}(this, function(Promise, Map, helpers) {
    "use strict";

    var defaultScanTime = 10.24 * 1000;
    var adapter = null;
    var adapters = {};

    function wrapReject(reject, msg) {
        return function(error) {
            reject(msg + ": " + error);
        };
    }

    function mergeDictionary(base, extension) {
        if (extension) {
            Object.keys(extension).forEach(function(key) {
                if (extension[key] && base.hasOwnProperty(key)) {
                    if (Object.prototype.toString.call(base[key]) === "[object Object]") mergeDictionary(base[key], extension[key]);
                    else if (Object.prototype.toString.call(base[key]) === "[object Map]" && Object.prototype.toString.call(extension[key]) === "[object Object]") {
                        Object.keys(extension[key]).forEach(function(mapKey) {
                            base[key].set(mapKey, extension[key][mapKey]);
                        });
                    }
                    else base[key] = extension[key];
                }
            });
        }
    }

    var events = {};
    function createListenerFn(eventTypes) {
        return function(type, callback, capture) {
            if (eventTypes.indexOf(type) < 0) return; //error
            if (!events[this]) events[this] = {};
            if (!events[this][type]) events[this][type] = [];
            events[this][type].push(callback);
        };
    }
    function removeEventListener(type, callback, capture) {
        if (!events[this] || !events[this][type]) return; //error
        var i = events[this][type].indexOf(callback);
        if (i >= 0) events[this][type].splice(i, 1);
        if (events[this][type].length === 0) delete events[this][type];
        if (Object.keys(events[this]).length === 0) delete events[this];
    }
    function dispatchEvent(event) {
        if (!events[this] || !events[this][event.type]) return; //error
        event.target = this;
        events[this][event.type].forEach(function(callback) {
            if (typeof callback === "function") callback(event);
        });
    }

    function filterDevice(options, deviceInfo) {
        var valid = false;
        var validServices = [];

        options.filters.forEach(function(filter) {
            // Name
            if (filter.name && filter.name !== deviceInfo.name) return;

            // NamePrefix
            if (filter.namePrefix) {
                if (filter.namePrefix.length > deviceInfo.name.length) return;
                if (filter.namePrefix !== deviceInfo.name.substr(0, filter.namePrefix.length)) return;
            }

            // Services
            if (filter.services) {
                var serviceUUIDs = filter.services.map(helpers.getServiceUUID);
                var servicesValid = serviceUUIDs.every(function(serviceUUID) {
                    return (deviceInfo.uuids.indexOf(serviceUUID) > -1);
                });

                if (!servicesValid) return;
                validServices = validServices.concat(serviceUUIDs);
            }

            valid = true;
        });

        if (!valid) return false;

        // Add additional services
        if (options.optionalServices) {
            validServices = validServices.concat(options.optionalServices.map(helpers.getServiceUUID));
        }

        // Set unique list of allowed services
        deviceInfo._allowedServices = validServices.filter(function(item, index, array) {
            return array.indexOf(item) === index;
        });

        return deviceInfo;
    }

    var scanner = null;
    function requestDevice(options) {
        return new Promise(function(resolve, reject) {
            if (scanner !== null) return reject("requestDevice error: request in progress");

            if (!options.deviceFound) {
                // Must have a filter
                if (!options.filters || options.filters.length === 0) {
                    return reject(new TypeError("requestDevice error: no filters specified"));
                }

                // Don't allow empty filters
                var emptyFilter = options.filters.some(function(filter) {
                    return (Object.keys(filter).length === 0);
                });
                if (emptyFilter) {
                    return reject(new TypeError("requestDevice error: empty filter specified"));
                }

                // Don't allow empty namePrefix
                var emptyPrefix = options.filters.some(function(filter) {
                    return (typeof filter.namePrefix !== "undefined" && filter.namePrefix === "");
                });
                if (emptyPrefix) {
                    return reject(new TypeError("requestDevice error: empty namePrefix specified"));
                }
            }

            var searchUUIDs = [];
            if (options.filters) {
                options.filters.forEach(function(filter) {
                    if (filter.services) searchUUIDs = searchUUIDs.concat(filter.services.map(helpers.getServiceUUID));
                });
            }
            // Unique-ify
            searchUUIDs = searchUUIDs.filter(function(item, index, array) {
                return array.indexOf(item) === index;
            });

            var scanTime = options.scanTime || defaultScanTime;
            var completeFn = options.deviceFound ? resolve : function() {
                reject("requestDevice error: no devices found");
            };

            adapter.startScan(searchUUIDs, function(deviceInfo) {

                // filter devices if filters specified
                if (options.filters) {
                    deviceInfo = filterDevice(options, deviceInfo);
                }

                if (deviceInfo) {
                    var bluetoothDevice = new BluetoothDevice(deviceInfo);
                    if (!options.deviceFound || options.deviceFound(bluetoothDevice)) {
                        cancelRequest()
                        .then(function() {
                            resolve(bluetoothDevice);
                        });
                    }
                }
            }, function() {
                scanner = setTimeout(function() {
                    cancelRequest()
                    .then(completeFn);
                }, scanTime);
            }, wrapReject(reject, "requestDevice error"));
        });
    }
    function cancelRequest() {
        return new Promise(function(resolve, reject) {
            if (scanner) {
                clearTimeout(scanner);
                scanner = null;
                adapter.stopScan();
            }
            resolve();
        });
    }

    // BluetoothDevice Object
    var BluetoothDevice = function(properties) {
        this._handle = null;
        this._allowedServices = [];

        this.id = "unknown"; 
        this.name = null;
        this.adData = {
            appearance: null,
            txPower: null,
            rssi: null,
            manufacturerData: new Map(),
            serviceData: new Map()
        };
        this.gatt = new BluetoothRemoteGATTServer();
        this.gatt.device = this;
        this.uuids = [];

        mergeDictionary(this, properties);
    };
    BluetoothDevice.prototype.addEventListener = createListenerFn([
        "gattserverdisconnected",
    ]);
    BluetoothDevice.prototype.removeEventListener = removeEventListener;
    BluetoothDevice.prototype.dispatchEvent = dispatchEvent;

    // BluetoothRemoteGATTServer Object
    var BluetoothRemoteGATTServer = function() {
        this._services = null;

        this.device = null;
        this.connected = false;
    };
    BluetoothRemoteGATTServer.prototype.connect = function() {
        return new Promise(function(resolve, reject) {
            if (this.connected) return reject("connect error: device already connected");

            adapter.connect(this.device._handle, function() {
                this.connected = true;
                resolve(this);
            }.bind(this), function() {
                this.connected = false;
                this.device.dispatchEvent({ type: "gattserverdisconnected", bubbles: true });
            }.bind(this), wrapReject(reject, "connect error"));
        }.bind(this));
    };
    BluetoothRemoteGATTServer.prototype.disconnect = function() {
        adapter.disconnect(this.device._handle);
        this.connected = false;
    };
    BluetoothRemoteGATTServer.prototype.getPrimaryService = function(serviceUUID) {
        return new Promise(function(resolve, reject) {
            if (!this.connected) return reject("getPrimaryService error: device not connected");
            if (!serviceUUID) return reject("getPrimaryService error: no service specified");

            this.getPrimaryServices(serviceUUID)
            .then(function(services) {
                if (services.length !== 1) return reject("getPrimaryService error: service not found");
                resolve(services[0]);
            })
            .catch(function(error) {
                reject(error);
            });
        }.bind(this));
    };
    BluetoothRemoteGATTServer.prototype.getPrimaryServices = function(serviceUUID) {
        return new Promise(function(resolve, reject) {
            if (!this.connected) return reject("getPrimaryServices error: device not connected");

            function complete() {
                if (!serviceUUID) return resolve(this._services);
                var filtered = this._services.filter(function(service) {
                    return (service.uuid === helpers.getServiceUUID(serviceUUID));
                });
                if (filtered.length !== 1) return reject("getPrimaryServices error: service not found");
                resolve(filtered);
            }
            if (this._services) return complete.call(this);
            adapter.discoverServices(this.device._handle, this.device._allowedServices, function(services) {
                this._services = services.map(function(serviceInfo) {
                    serviceInfo.device = this.device;
                    return new BluetoothRemoteGATTService(serviceInfo);
                }.bind(this));
                complete.call(this);
            }.bind(this), wrapReject(reject, "getPrimaryServices error"));
        }.bind(this));
    };

    // BluetoothRemoteGATTService Object
    var BluetoothRemoteGATTService = function(properties) {
        this._handle = null;
        this._services = null;
        this._characteristics = null;

        this.device = null;
        this.uuid = null;
        this.isPrimary = false;

        mergeDictionary(this, properties);
        this.dispatchEvent({ type: "serviceadded", bubbles: true });
    };
    BluetoothRemoteGATTService.prototype.getCharacteristic = function(characteristicUUID) {
        return new Promise(function(resolve, reject) {
            if (!this.device.gatt.connected) return reject("getCharacteristic error: device not connected");
            if (!characteristicUUID) return reject("getCharacteristic error: no characteristic specified");

            this.getCharacteristics(characteristicUUID)
            .then(function(characteristics) {
                if (characteristics.length !== 1) return reject("getCharacteristic error: characteristic not found");
                resolve(characteristics[0]);
            })
            .catch(function(error) {
                reject(error);
            });
        }.bind(this));
    };
    BluetoothRemoteGATTService.prototype.getCharacteristics = function(characteristicUUID) {
        return new Promise(function(resolve, reject) {
            if (!this.device.gatt.connected) return reject("getCharacteristics error: device not connected");

            function complete() {
                if (!characteristicUUID) return resolve(this._characteristics);
                var filtered = this._characteristics.filter(function(characteristic) {
                    return (characteristic.uuid === helpers.getCharacteristicUUID(characteristicUUID));
                });
                if (filtered.length !== 1) return reject("getCharacteristics error: characteristic not found");
                resolve(filtered);
            }
            if (this._characteristics) return complete.call(this);
            adapter.discoverCharacteristics(this._handle, [], function(characteristics) {
                this._characteristics = characteristics.map(function(characteristicInfo) {
                    characteristicInfo.service = this;
                    return new BluetoothRemoteGATTCharacteristic(characteristicInfo);
                }.bind(this));
                complete.call(this);
            }.bind(this), wrapReject(reject, "getCharacteristics error"));
        }.bind(this));
    };
    BluetoothRemoteGATTService.prototype.getIncludedService = function(serviceUUID) {
        return new Promise(function(resolve, reject) {
            if (!this.device.gatt.connected) return reject("getIncludedService error: device not connected");
            if (!serviceUUID) return reject("getIncludedService error: no service specified");

            this.getIncludedServices(serviceUUID)
            .then(function(services) {
                if (services.length !== 1) return reject("getIncludedService error: service not found");
                resolve(services[0]);
            })
            .catch(function(error) {
                reject(error);
            });
        }.bind(this));
    };
    BluetoothRemoteGATTService.prototype.getIncludedServices = function(serviceUUID) {
        return new Promise(function(resolve, reject) {
            if (!this.device.gatt.connected) return reject("getIncludedServices error: device not connected");

            function complete() {
                if (!serviceUUID) return resolve(this._services);
                var filtered = this._services.filter(function(service) {
                    return (service.uuid === helpers.getServiceUUID(serviceUUID));
                });
                if (filtered.length !== 1) return reject("getIncludedServices error: service not found");
                resolve(filtered);
            }
            if (this._services) return complete.call(this);
            adapter.discoverIncludedServices(this._handle, this.device._allowedServices, function(services) {
                this._services = services.map(function(serviceInfo) {
                    serviceInfo.device = this.device;
                    return new BluetoothRemoteGATTService(serviceInfo);
                }.bind(this));
                complete.call(this);
            }.bind(this), wrapReject(reject, "getIncludedServices error"));
        }.bind(this));
    };
    BluetoothRemoteGATTService.prototype.addEventListener = createListenerFn([
        "serviceadded",
        "servicechanged",
        "serviceremoved"
    ]);
    BluetoothRemoteGATTService.prototype.removeEventListener = removeEventListener;
    BluetoothRemoteGATTService.prototype.dispatchEvent = dispatchEvent;

    // BluetoothRemoteGATTCharacteristic Object
    var BluetoothRemoteGATTCharacteristic = function(properties) {
        this._handle = null;
        this._descriptors = null;

        this.service = null;
        this.uuid = null;
        this.properties = {
            broadcast: false,
            read: false,
            writeWithoutResponse: false,
            write: false,
            notify: false,
            indicate: false,
            authenticatedSignedWrites: false,
            reliableWrite: false,
            writableAuxiliaries: false
        };
        this.value = null;

        mergeDictionary(this, properties);
    };
    BluetoothRemoteGATTCharacteristic.prototype.getDescriptor = function(descriptorUUID) {
        return new Promise(function(resolve, reject) {
            if (!this.service.device.gatt.connected) return reject("getDescriptor error: device not connected");
            if (!descriptorUUID) return reject("getDescriptor error: no descriptor specified");

            this.getDescriptors(descriptorUUID)
            .then(function(descriptors) {
                if (descriptors.length !== 1) return reject("getDescriptor error: descriptor not found");
                resolve(descriptors[0]);
            })
            .catch(function(error) {
                reject(error);
            });
        }.bind(this));
    };
    BluetoothRemoteGATTCharacteristic.prototype.getDescriptors = function(descriptorUUID) {
        return new Promise(function(resolve, reject) {
            if (!this.service.device.gatt.connected) return reject("getDescriptors error: device not connected");

            function complete() {
                if (!descriptorUUID) return resolve(this._descriptors);
                var filtered = this._descriptors.filter(function(descriptor) {
                    return (descriptor.uuid === helpers.getDescriptorUUID(descriptorUUID));
                });
                if (filtered.length !== 1) return reject("getDescriptors error: descriptor not found");
                resolve(filtered);
            }
            if (this._descriptors) return complete.call(this);
            adapter.discoverDescriptors(this._handle, [], function(descriptors) {
                this._descriptors = descriptors.map(function(descriptorInfo) {
                    descriptorInfo.characteristic = this;
                    return new BluetoothRemoteGATTDescriptor(descriptorInfo);
                }.bind(this));
                complete.call(this);
            }.bind(this), wrapReject(reject, "getDescriptors error"));
        }.bind(this));
    };
    BluetoothRemoteGATTCharacteristic.prototype.readValue = function() {
        return new Promise(function(resolve, reject) {
            if (!this.service.device.gatt.connected) return reject("readValue error: device not connected");

            adapter.readCharacteristic(this._handle, function(dataView) {
                this.value = dataView;
                resolve(dataView);
                this.dispatchEvent({ type: "characteristicvaluechanged", bubbles: true });
            }.bind(this), wrapReject(reject, "readValue error"));
        }.bind(this));
    };
    BluetoothRemoteGATTCharacteristic.prototype.writeValue = function(bufferSource) {
        return new Promise(function(resolve, reject) {
            if (!this.service.device.gatt.connected) return reject("writeValue error: device not connected");

            var arrayBuffer = bufferSource.buffer || bufferSource;
            var dataView = new DataView(arrayBuffer);
            adapter.writeCharacteristic(this._handle, dataView, function() {
                this.value = dataView;
                resolve();
            }.bind(this), wrapReject(reject, "writeValue error"));
        }.bind(this));
    };
    BluetoothRemoteGATTCharacteristic.prototype.startNotifications = function() {
        return new Promise(function(resolve, reject) {
            if (!this.service.device.gatt.connected) return reject("startNotifications error: device not connected");

            adapter.enableNotify(this._handle, function(dataView) {
                this.value = dataView;
                this.dispatchEvent({ type: "characteristicvaluechanged", bubbles: true });
            }.bind(this), resolve, wrapReject(reject, "startNotifications error"));
        }.bind(this));
    };
    BluetoothRemoteGATTCharacteristic.prototype.stopNotifications = function() {
        return new Promise(function(resolve, reject) {
            if (!this.service.device.gatt.connected) return reject("stopNotifications error: device not connected");

            adapter.disableNotify(this._handle, resolve, wrapReject(reject, "stopNotifications error"));
        }.bind(this));
    };
    BluetoothRemoteGATTCharacteristic.prototype.addEventListener = createListenerFn([
        "characteristicvaluechanged"
    ]);
    BluetoothRemoteGATTCharacteristic.prototype.removeEventListener = removeEventListener;
    BluetoothRemoteGATTCharacteristic.prototype.dispatchEvent = dispatchEvent;

    // BluetoothRemoteGATTDescriptor Object
    var BluetoothRemoteGATTDescriptor = function(properties) {
        this._handle = null;

        this.characteristic = null;
        this.uuid = null;
        this.value = null;

        mergeDictionary(this, properties);
    };
    BluetoothRemoteGATTDescriptor.prototype.readValue = function() {
        return new Promise(function(resolve, reject) {
            if (!this.characteristic.service.device.gatt.connected) return reject("readValue error: device not connected");

            adapter.readDescriptor(this._handle, function(dataView) {
                this.value = dataView;
                resolve(dataView);
            }.bind(this), wrapReject(reject, "readValue error"));
        }.bind(this));
    };
    BluetoothRemoteGATTDescriptor.prototype.writeValue = function(bufferSource) {
        return new Promise(function(resolve, reject) {
            if (!this.characteristic.service.device.gatt.connected) return reject("writeValue error: device not connected");

            var arrayBuffer = bufferSource.buffer || bufferSource;
            var dataView = new DataView(arrayBuffer);
            adapter.writeDescriptor(this._handle, dataView, function() {
                this.value = dataView;
                resolve();
            }.bind(this), wrapReject(reject, "writeValue error"));
        }.bind(this));
    };

    // Bluetooth Object
    return {
        _addAdapter: function(adapterName, definition) {
            adapters[adapterName] = definition;
            adapter = definition;
        },
        requestDevice: requestDevice,
        cancelRequest: cancelRequest
    };
}));