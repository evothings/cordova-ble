// API definition for EvoThings BLE plugin.
//
// Use jsdoc to generate documentation.

// The following line causes a jsdoc error.
// Use the jsdoc option -l to ignore the error.
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
* @property {string} scanRecord - Base64-encoded binary data. Its meaning is device-specific. Not available on iOS.
* @property {AdvertisementData} advertisementData - Object containing some of the data from the scanRecord. Available only on iOS.
*/

/** Information extracted from a scanRecord. Some or all of the fields may be undefined. This varies between BLE devices.
 * Depending on OS version and BLE device, additional fields, not documented here, may be present.
 * @typedef {Object} AdvertisementData
 * @property {string} kCBAdvDataLocalName - The device's name. Equal to DeviceInfo.name.
 * @property {number} kCBAdvDataChannel - A positive integer, the BLE channel on which the device listens for connections. Ignore this number.
 * @property {boolean} kCBAdvDataIsConnectable - True if the device accepts connections. False if it doesn't.
 * @property {array} kCBAdvDataServiceUUIDs - Array of strings, the UUIDs of services advertised by the device. Formatted according to RFC 4122, all lowercase.
 * @property {string} kCBAdvDataManufacturerData - Base-64-encoded binary data. This field is used by BLE devices to advertise custom data that don't fit into any of the other fields.
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
		console.log('BLE connect status for device: '
			+ info.deviceHandle
			+ ' state: '
			+ info.state);
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
* @property {number} deviceHandle - Handle to the device. Save it for other function calls.
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
* <p>Does not cause any callbacks to the function passed to connect().

* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @example
evothings.ble.close(deviceHandle);
*/
exports.close = function(deviceHandle) {
	exec(null, null, 'BLE', 'close', [deviceHandle]);
};

/** Fetch the remote device's RSSI (signal strength).
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {rssiCallback} win
* @param {failCallback} fail
* @example
evothings.ble.rssi(
	deviceHandle,
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
exports.rssi = function(deviceHandle, win, fail) {
	exec(win, fail, 'BLE', 'rssi', [deviceHandle]);
};

/** This function is called when a new device is discovered.
* @callback rssiCallback
* @param {number} rssi - A negative integer, the signal strength in decibels.
*/

/** Fetch information about a remote device's services.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {serviceCallback} win - Called with array of {@link Service} objects.
* @param {failCallback} fail
* @example
evothings.ble.services(
	deviceHandle,
	function(services)
	{
		for (var i = 0; i < services.length; i++)
		{
			var service = services[i];
			console.log('BLE service: ');
			console.log('  ' + service.handle);
			console.log('  ' + service.uuid);
			console.log('  ' + service.serviceType);
		}
	},
	function(errorCode)
	{
		console.log('BLE services error: ' + errorCode);
	});
*/
exports.services = function(deviceHandle, win, fail) {
	exec(win, fail, 'BLE', 'services', [deviceHandle]);
};

/**
* @callback serviceCallback
* @param {Array} services - Array of {@link Service} objects.
*/

/** Describes a GATT service.
* @typedef {Object} Service
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {serviceType} type
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

/** Fetch information about a service's characteristics.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} serviceHandle - A handle from {@link serviceCallback}.
* @param {characteristicCallback} win - Called with array of {@link Characteristic} objects.
* @param {failCallback} fail
* @example
evothings.ble.characteristics(
	deviceHandle,
	service.handle,
	function(characteristics)
	{
		for (var i = 0; i < characteristics.length; i++)
		{
			var characteristic = characteristics[i];
			console.log('BLE characteristic: ' + characteristic.uuid);
		}
	},
	function(errorCode)
	{
		console.log('BLE characteristics error: ' + errorCode);
	});
*/
exports.characteristics = function(deviceHandle, serviceHandle, win, fail) {
	exec(win, fail, 'BLE', 'characteristics', [deviceHandle, serviceHandle]);
};

/**
* @callback characteristicCallback
* @param {Array} characteristics - Array of {@link Characteristic} objects.
*/

/** Describes a GATT characteristic.
* @typedef {Object} Characteristic
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {permission} permissions - Bitmask of zero or more permission flags.
* @property {property} properties - Bitmask of zero or more property flags.
* @property {writeType} writeType
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

/** Fetch information about a characteristic's descriptors.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {descriptorCallback} win - Called with array of {@link Descriptor} objects.
* @param {failCallback} fail
* @example
evothings.ble.descriptors(
	deviceHandle,
	characteristic.handle,
	function(descriptors)
	{
		for (var i = 0; i < descriptors.length; i++)
		{
			var descriptor = descriptors[i];
			console.log('BLE descriptor: ' + descriptor.uuid);
		}
	},
	function(errorCode)
	{
		console.log('BLE descriptors error: ' + errorCode);
	});
*/
exports.descriptors = function(deviceHandle, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'descriptors', [deviceHandle, characteristicHandle]);
};

/**
* @callback descriptorCallback
* @param {Array} descriptors - Array of {@link Descriptor} objects.
*/

/** Describes a GATT descriptor.
* @typedef {Object} Descriptor
* @property {number} handle
* @property {string} uuid - Formatted according to RFC 4122, all lowercase.
* @property {permission} permissions - Bitmask of zero or more permission flags.
*/

// TODO: What is read* ?
// read*: fetch and return value in one op.
// values should be cached on the JS side, if at all.

/**
* @callback dataCallback
* @param {ArrayBuffer} data
*/

/** Reads a characteristic's value from a remote device.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {dataCallback} win
* @param {failCallback} fail
* @example
evothings.ble.readCharacteristic(
	deviceHandle,
	characteristic.handle,
	function(data)
	{
		console.log('BLE characteristic data: ' + evothings.ble.fromUtf8(data));
	},
	function(errorCode)
	{
		console.log('BLE readCharacteristic error: ' + errorCode);
	});
*/
exports.readCharacteristic = function(deviceHandle, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'readCharacteristic', [deviceHandle, characteristicHandle]);
};

/** Reads a descriptor's value from a remote device.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} descriptorHandle - A handle from {@link descriptorCallback}.
* @param {dataCallback} win
* @param {failCallback} fail
* @example
evothings.ble.readDescriptor(
	deviceHandle,
	descriptor.handle,
	function(data)
	{
		console.log('BLE descriptor data: ' + evothings.ble.fromUtf8(data));
	},
	function(errorCode)
	{
		console.log('BLE readDescriptor error: ' + errorCode);
	});
*/
exports.readDescriptor = function(deviceHandle, descriptorHandle, win, fail) {
	exec(win, fail, 'BLE', 'readDescriptor', [deviceHandle, descriptorHandle]);
};

/**
* @callback emptyCallback - Callback that takes no parameters.
This callback indicates that an operation was successful,
without specifying and additional information.
*/

/** Write a characteristic's value to the remote device.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {ArrayBufferView} data - The value to be written.
* @param {emptyCallback} win
* @param {failCallback} fail
* @example TODO: Add example.
*/
exports.writeCharacteristic = function(deviceHandle, characteristicHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeCharacteristic', [deviceHandle, characteristicHandle, data.buffer]);
};

/** Write a descriptor's value to a remote device.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} descriptorHandle - A handle from {@link descriptorCallback}.
* @param {ArrayBufferView} data - The value to be written.
* @param {emptyCallback} win
* @param {failCallback} fail
* @example TODO: Add example.
*/
exports.writeDescriptor = function(deviceHandle, descriptorHandle, data, win, fail) {
	exec(win, fail, 'BLE', 'writeDescriptor', [deviceHandle, descriptorHandle, data.buffer]);
};

/** Request notification on changes to a characteristic's value.
* This is more efficient than polling the value using readCharacteristic().
*
* <p>To activate notifications,
* some (all?) devices require you to write a special value to a separate configuration characteristic,
* in addition to calling this function.
* Refer to your device's documentation.
*
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {dataCallback} win - Called every time the value changes.
* @param {failCallback} fail
* @example
evothings.ble.enableNotification(
	deviceHandle,
	characteristic.handle,
	function(data)
	{
		console.log('BLE characteristic data: ' + evothings.ble.fromUtf8(data));
	},
	function(errorCode)
	{
		console.log('BLE enableNotification error: ' + errorCode);
	});
*/
exports.enableNotification = function(deviceHandle, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'enableNotification', [deviceHandle, characteristicHandle]);
};

/** Disable notification of changes to a characteristic's value.
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {number} characteristicHandle - A handle from {@link characteristicCallback}.
* @param {emptyCallback} win
* @param {failCallback} fail
* @example
evothings.ble.disableNotification(
	deviceHandle,
	characteristic.handle,
	function()
	{
		console.log('BLE characteristic notification disabled');
	},
	function(errorCode)
	{
		console.log('BLE disableNotification error: ' + errorCode);
	});
*/
exports.disableNotification = function(deviceHandle, characteristicHandle, win, fail) {
	exec(win, fail, 'BLE', 'disableNotification', [deviceHandle, characteristicHandle]);
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
* Available on Android 4.3+. This function takes 3-5 seconds to reset BLE.
* On iOS this function stops any ongoing scan operation and disconnects
* all connected devices.
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
	var strUtf8 = unescape(encodeURIComponent(s));
	var ab = new Uint8Array(strUtf8.length);
	for (var i = 0; i < strUtf8.length; i++) {
		ab[i] = strUtf8.charCodeAt(i);
	}
	return ab;
};


/** Fetch information about a remote device's services,
* as well as its associated characteristics and descriptors.
*
* This function is an easy-to-use wrapper of the low-level functions
* ble.services(), ble.characteristics() and ble.descriptors().
*
* @param {number} deviceHandle - A handle from {@link connectCallback}.
* @param {serviceCallback} win - Called with array of {@link Service} objects.
* Those Service objects each have an additional field "characteristics", which is an array of {@link Characteristic} objects.
* Those Characteristic objects each have an additional field "descriptors", which is an array of {@link Descriptor} objects.
* @param {failCallback} fail
*/
exports.readAllServiceData = function(deviceHandle, win, fail)
{
	// Array of populated services.
	var serviceArray = [];

	// Counter that tracks the number of info items read.
	// This value is incremented and decremented when reading.
	// When value is back to zero, all items are read.
	var readCounter = 0;

	var servicesCallbackFun = function()
	{
		return function(services)
		{
			readCounter += services.length;
			for (var i = 0; i < services.length; ++i)
			{
				var service = services[i];
				serviceArray.push(service);
				service.characteristics = [];

				// Read characteristics for service.
        exports.characteristics(
					deviceHandle,
					service.handle,
					characteristicsCallbackFun(service),
					function(errorCode)
					{
						console.log('characteristics error: ' + errorCode);
						fail(errorCode);
					});
			}
		};
	};

	var characteristicsCallbackFun = function(service)
	{
		return function(characteristics)
		{
			--readCounter;
			readCounter += characteristics.length;
			for (var i = 0; i < characteristics.length; ++i)
			{
				var characteristic = characteristics[i];
				service.characteristics.push(characteristic);
				characteristic.descriptors = [];

				// Read descriptors for characteristic.
        exports.descriptors(
					deviceHandle,
					characteristic.handle,
					descriptorsCallbackFun(characteristic),
					function(errorCode)
					{
						console.log('descriptors error: ' + errorCode);
						fail(errorCode);
					});
			}
		};
	};

	var descriptorsCallbackFun = function(characteristic)
	{
		return function(descriptors)
		{
			--readCounter;
			for (var i = 0; i < descriptors.length; ++i)
			{
				var descriptor = descriptors[i];
				characteristic.descriptors.push(descriptor);
			}
			if (0 == readCounter)
			{
				// Everything is read.
				win(serviceArray);
			}
		};
	};

	// Read services for device.
	exports.services(
		deviceHandle,
		servicesCallbackFun(),
		function(errorCode)
		{
			console.log('services error: ' + errorCode);
			fail(errorCode);
		});
};
