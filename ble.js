
// This line causes a jsdoc error.
// Use the option -l to ignore it.
var exec = cordova.require('cordova/exec');

/** @module com.evothings.ble */

/** Starts scanning for devices.
* <p>Found devices and errors will be reported to the supplied callbacks.</p>
* <p>Will keep scanning indefinitely until you call stopScan().</p>
* To conserve energy, call stopScan() as soon as you've found the device you're looking for.
* <p>Calling this function while scanning is in progress has no effect?</p>
*
* @param {scanCallback} win
* @param {failCallback} fail
*
* @example
evothings.ble.startScan(
	function(device)
	{
		console.log('BLE startScan found device named: ' + device.name);
	},
	function(errorCode)
	{
		console.log('BLE startScan error: ' + errorCode);
	}
);
*/
exports.startScan = function(win, fail) {
	exec(win, fail, 'BLE', 'startScan', []);
};

/** This function is a parameter to startScan() and is called when a new device is discovered.
* @callback scanCallback
* @param {DeviceInfo} device
*/

/** Info about a BLE device.
* @typedef {Object} DeviceInfo
//* @property {string} address - Has the form xx:xx:xx:xx:xx:xx, where x are hexadecimal characters.
* @property {string} address - Uniquely identifies the device. Pass this to connect().
* The form of the address depends on the host platform.
* @property {number} rssi - A negative integer, the signal strength in decibels.
* @property {string} name - The device's name, or nil.
* @property {string} scanRecord - A string of bytes. Its meaning is device-specific.
*/

/** This function is called when an operation fails.
* @callback failCallback
* @param {string} errorString - A human-readable string that describes the error that occurred.
*/

/** Stops scanning for devices.
*
* @example
evothings.ble.stopScan();
*/
exports.stopScan = function() {
	exec(null, null, 'BLE', 'stopScan', []);
};

/** Connect to a remote device.
* @param {string} address - From scanCallback.
* @param {connectCallback} win
* @param {failCallback} fail
* @example
evothings.ble.connect(
	address,
	function(info)
	{
		console.log('BLE connect status for device: ' + info.device + ' state: ' + info.state);
	},
	function(errorCode)
	{
		console.log('BLE connect error: ' + errorCode);
	}
);
*/
exports.connect = function(address, win, fail) {
	exec(win, fail, 'BLE', 'connect', [address]);
};

/** Will be called whenever the device's connection state changes.
* @callback connectCallback
* @param {ConnectInfo} info
*/

/** Info about connection events and state.
* @typedef {Object} ConnectInfo
* @property {number} device - Handle to the device. Save it for other function calls.
* @property {number} state - One of the {@link connectionState} keys.
*/

/** A number-string map describing possible connection states.
* @global
* @readonly
* @enum {string}
*/
exports.connectionState = {
	0: 'STATE_DISCONNECTED',
	1: 'STATE_CONNECTING',
	2: 'STATE_CONNECTED',
	3: 'STATE_DISCONNECTING',
};

/** Close the connection to a remote device.
* <p>Frees any native resources associated with the device.
* <p>Causes STATE_DISCONNECTING and STATE_DISCONNECTED callbacks to the function passed to connect().
* @param {number} device - A handle from {@link connectCallback}.
* @example
evothings.ble.close(device);
*/
exports.close = function(device) {
	exec(null, null, 'BLE', 'close', [device]);
};

/** Fetch the remote device's RSSI (signal strength).
* @param {number} device - A handle from {@link connectCallback}.
* @param {rssiCallback} win
* @param {failCallback} fail
* @example
evothings.ble.rssi(
	device,
	function(rssi)
	{
		console.log('BLE rssi: ' + rssi);
	},
	function(errorCode)
	{
		console.log('BLE rssi error: ' + errorCode);
	}
);
*/
exports.rssi = function(device, win, fail) {
	exec(win, fail, 'BLE', 'rssi', [device]);
};

/** This function is called when a new device is discovered.
* @callback rssiCallback
* @param {number} rssi - A negative integer, the signal strength in decibels.
*/

/** Fetch a remote device's services and iterate through them.
* @param {number} device - A handle from {@link connectCallback}.
* @param {serviceCallback} win - Called once for each service.
* @param {failCallback} fail
*/
exports.services = function(device, win, fail) {
	exec(win, fail, 'BLE', 'services', [device]);
};

/**
* @callback serviceCallback
* @param {Service} service
*/

/** Describes a GATT service.
* @typedef {Object} Service
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {serviceType} type
* @property {number} characteristicCount - The number of characteristics in the service.
* @property {number} serviceCount - The number of services in the device. This value is the same for all services in a device.
*/

/** A number-string map describing possible service types.
* @global
* @readonly
* @enum {string}
*/
exports.serviceType = {
	0: 'SERVICE_TYPE_PRIMARY',
	1: 'SERVICE_TYPE_SECONDARY',
};

/** Iterate through a service's characteristics.
* @param {number} device - A handle from {@link connectCallback}.
* @param {number} serviceHandle - A handle from {@link serviceCallback}.
* @param {characteristicCallback} win - Called once for each characteristic.
*/
exports.characteristics = function(device, serviceHandle, win) {
	exec(win, null, 'BLE', 'characteristics', [device, serviceHandle]);
};

/**
* @callback characteristicCallback
* @param {Characteristic} characteristic
*/

/** Describes a GATT characteristic.
* @typedef {Object} Characteristic
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {permission} permissions - Bitmask of zero or more permission flags.
* @property {property} properties - Bitmask of zero or more property flags.
* @property {writeType} writeType
* @property {number} descriptorCount - The number of descriptors in the descriptor.
*/

/** A number-string map describing possible permission flags.
* @global
* @readonly
* @enum {string}
*/
exports.permission = {
	1: 'PERMISSION_READ',
	2: 'PERMISSION_READ_ENCRYPTED',
	4: 'PERMISSION_READ_ENCRYPTED_MITM',
	16: 'PERMISSION_WRITE',
	32: 'PERMISSION_WRITE_ENCRYPTED',
	64: 'PERMISSION_WRITE_ENCRYPTED_MITM',
	128: 'PERMISSION_WRITE_SIGNED',
	256: 'PERMISSION_WRITE_SIGNED_MITM',
};

/** A number-string map describing possible property flags.
* @global
* @readonly
* @enum {string}
*/
exports.property = {
	1: 'PROPERTY_BROADCAST',
	2: 'PROPERTY_READ',
	4: 'PROPERTY_WRITE_NO_RESPONSE',
	8: 'PROPERTY_WRITE',
	16: 'PROPERTY_NOTIFY',
	32: 'PROPERTY_INDICATE',
	64: 'PROPERTY_SIGNED_WRITE',
	128: 'PROPERTY_EXTENDED_PROPS',
};

/** A number-string map describing possible write types.
* @global
* @readonly
* @enum {string}
*/
exports.writeType = {
	1: 'WRITE_TYPE_NO_RESPONSE',
	2: 'WRITE_TYPE_DEFAULT',
	4: 'WRITE_TYPE_SIGNED',
};

/** Iterate through a characteristic's descriptors.
* @param {number} device - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {descriptorCallback} win - Called once for each descriptor.
*/
exports.descriptors = function(device, characteristicHandle, win) {
	exec(win, null, 'BLE', 'descriptors', [device, characteristicHandle]);
};

/**
* @callback descriptorCallback
* @param {Descriptor} descriptor
*/

/** Describes a GATT descriptor.
* @typedef {Object} Descriptor
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {permission} permissions - Bitmask of zero or more permission flags.
*/


// read*: fetch and return value in one op.
// values should be cached on the JS side, if at all.

/**
* @callback dataCallback
* @param {ArrayBuffer} data
*/

/** Reads a characteristic's value from a remote device.
* @param {number} device - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {dataCallback} win
* @param {failCallback} fail
*/
exports.readCharacteristic = function(device, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'readCharacteristic', [device, characteristicHandle]);
};

/** Reads a descriptor's value from a remote device.
* @param {number} device - A handle from {@link connectCallback}.
* @param {number} descriptorHandle - A handle from {@link descriptorCallback}.
* @param {dataCallback} win
* @param {failCallback} fail
*/
exports.readDescriptor = function(device, descriptorHandle, win, fail) {
	exec(win, fail, 'BLE', 'readDescriptor', [device, descriptorHandle]);
};

/**
* @callback emptyCallback
*/

/** Write a characteristic's value to the remote device.
* @param {number} device - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {ArrayBufferView} data - The value to be written.
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.writeCharacteristic = function(device, characteristicHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeCharacteristic', [device, characteristicHandle, data.buffer]);
};

/** Write a descriptor's value to a remote device.
* @param {number} device - A handle from {@link connectCallback}.
* @param {number} descriptorHandle - A handle from {@link descriptorCallback}.
* @param {ArrayBufferView} data - The value to be written.
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.writeDescriptor = function(device, descriptorHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeDescriptor', [device, descriptorHandle, data.buffer]);
};

/** Request notification on changes to a characteristic's value.
* This is more efficient than polling the value using readCharacteristic().
*
* <p>To activate notifications,
* some (all?) devices require you to write a special value to a separate configuration characteristic,
* in addition to calling this function.
* Refer to your device's documentation.
*
* @param {number} device - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {dataCallback} win - Called every time the value changes.
* @param {failCallback} fail
*/
exports.enableNotification = function(device, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'enableNotification', [device, characteristicHandle]);
};

/** Disable notification of changes to a characteristic's value.
* @param {number} device - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.disableNotification = function(device, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'disableNotification', [device, characteristicHandle]);
};

/** i is an integer. It is converted to byte and put in an array[1].
* The array is returned.
* <p>assert(string.charCodeAt(0) == i).
*
* @param {number} i
* @param {dataCallback} win - Called every time the value changes.
*/
exports.testCharConversion = function(i, win) {
	exec(win, null, 'BLE', 'testCharConversion', [i]);
};

/** Resets the device's Bluetooth system.
* This is useful on some buggy devices where BLE functions stops responding until reset.
* Read: Android 4.3.
* <p>This function takes 3-5 seconds.
*
* @param {emptyCallback} win
* @param {failCallback} fail
*/
exports.reset = function(win, fail) {
	exec(win, fail, 'BLE', 'reset', []);
};

/** Converts an ArrayBuffer containing UTF-8 data to a JavaScript String.
* @param {ArrayBuffer} a
* @returns string
*/
exports.fromUtf8 = function(a) {
	return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(a))));
};

/** Converts a JavaScript String to an Uint8Array containing UTF-8 data.
* @param {string} s
* @returns Uint8Array
*/
exports.toUtf8 = function(s) {
	return new Uint8Array(unescape(encodeURIComponent(s)));
};
